import { Container, Sprite } from "pixi.js";
import { ImageName } from "../../../../resources/resources";
import { Layer } from "../../../config/layers";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";
import { on } from "../../../core/entity/handler";
import { colorLerp, darken } from "../../../core/util/ColorUtils";
import { angleDelta, clamp, lerp } from "../../../core/util/MathUtil";
import { choose, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import type { BodyPoses, BodyTextures } from "../../creature-stuff/BodySprite";
import { BLOB_TEXTURES, SPLAT_TEXTURES } from "../../effects/Splat";
import Burning, { Flammable, ignite } from "../../fire/Burning";
import type Human from "../../human/Human";

/** Seconds to fall from standing to lying down */
const FALL_TIME = 0.35;
/** Seconds for the pool of blood under it to spread */
const POOL_TIME = 4;
/** Seconds of burning to go from fresh to fully charred */
const CHAR_TIME = 4;
/** What a fully charred body is tinted */
export const CHARRED_TINT = 0x584840;
/** How red the blood is */
const BLOOD_COLOR = 0xff0000;
/** Legs picture length, in torso lengths, and width, in body widths (it has space around the legs) */
export const LEGS_LENGTH = 1.05;
export const LEGS_WIDTH = 1.45;

/** Where the hands can end up, for the arm on the right (+y); mirrored for the left */
const HAND_SPOTS: V2d[] = [V(0.34, 0.12), V(0.12, 0.34), V(-0.26, 0.2)];

/** Which parts it still has */
export interface CorpseParts {
  head: boolean;
  leftArm: boolean;
  rightArm: boolean;
  legs: boolean;
}

export interface CorpseOptions {
  /** Lying down, from the waist up (a crawler's) */
  textures: BodyTextures;
  /** Its legs lying down, waist on the right */
  legs?: ImageName;
  /** Half the width of the body lying down, in meters */
  radius: number;
  /** Where the shoulders end up */
  position: V2d;
  /** Which way the head ends up pointing */
  angle: number;
  /** Where its parts were when it died, to fall from */
  from: BodyPoses;
  /** The torso it had standing, to fade from, with where its anchor was */
  standingTorso: { texture: ImageName; anchor: number; scale: number };
  parts: CorpseParts;
  /** Tint on all of it, like a sprinter's */
  tint?: number;
  /** How charred it is, 0 to 1. It gets more charred while it burns. */
  char: number;
  /** Still on fire, for this many seconds, lit by this human */
  burning?: { timeLeft: number; source?: Human };
}

/** A part lying down, in the corpse's own coordinates */
interface Pose {
  position: V2d;
  angle: number;
}

/**
 * A dead zombie: falls over from where it stood, and lies there for the rest
 * of the floor in a spreading pool of blood. It can be missing its head, an
 * arm or its legs. If it died burning it keeps burning for a while, getting
 * more charred.
 */
export default class Corpse extends BaseEntity implements Entity, Flammable {
  sprites: (Container & GameSprite)[];
  burning?: Burning;
  readonly burnTime = 0;
  readonly burnDps = 0;
  readonly burnDamageInterval = 1;

  private bodySprite: Container & GameSprite = new Container();
  private pool: Container & GameSprite = new Container();
  private poolSplats: { sprite: Sprite; size: number }[] = [];
  private char: number;
  private baseTint: number;

  private standingTorsoSprite: Sprite;
  private torsoSprite: Sprite;
  private headSprite?: Sprite;
  private legsSprite?: Sprite;
  private arms: {
    arm: Sprite;
    hand: Sprite;
    from: { shoulder: V2d; hand: Pose };
    to: { shoulder: V2d; hand: Pose };
  }[] = [];
  private headFrom: Pose;
  private headTo: Pose;
  private torsoFrom: Pose;
  private legsTo: Pose;
  private armThicknessFrom: number;
  private armThickness: number;
  private legsLength: number;

  constructor(private options: CorpseOptions) {
    super();
    const { textures, radius, parts, from } = options;
    this.char = options.char;
    this.baseTint = options.tint ?? 0xffffff;
    this.bodySprite.layerName = Layer.FLOOR_STUFF;
    this.pool.layerName = Layer.FLOOR_DECALS;
    this.bodySprite.position.copyFrom(options.position);
    this.bodySprite.rotation = options.angle;
    this.pool.position.copyFrom(options.position);
    this.pool.rotation = options.angle;
    this.sprites = [this.pool, this.bodySprite];

    // The standing parts, in the corpse's coordinates
    const local = (pose: { position: V2d; angle: number }): Pose => ({
      position: pose.position.toLocalFrame(options.position, options.angle),
      angle: pose.angle - options.angle,
    });

    // Sized like a crawler
    this.torsoSprite = Sprite.from(textures.torso);
    const scale = (radius * 2) / this.torsoSprite.texture.height;
    this.torsoSprite.anchor.set(0.9, 0.5);
    this.torsoSprite.scale.set(scale);
    const torsoLength = this.torsoSprite.width;
    this.torsoFrom = local(from.torso);

    const standing = options.standingTorso;
    this.standingTorsoSprite = Sprite.from(standing.texture);
    this.standingTorsoSprite.anchor.set(standing.anchor, 0.5);
    this.standingTorsoSprite.scale.set(standing.scale);

    if (parts.legs && options.legs) {
      const legs = Sprite.from(options.legs);
      // The waist is at the right edge of the picture
      legs.anchor.set(0.99, 0.5);
      this.legsLength = torsoLength * LEGS_LENGTH;
      legs.width = this.legsLength;
      legs.height = radius * 2 * LEGS_WIDTH;
      this.legsSprite = legs;
    } else {
      this.legsLength = 0;
    }
    this.legsTo = {
      position: V(-0.4 * torsoLength, 0),
      angle: rUniform(-0.15, 0.15),
    };

    const armTexture = Sprite.from(textures.leftArm).texture;
    this.armThickness = scale * armTexture.height;
    this.armThicknessFrom = from.armThickness;
    const shoulderOffset = radius - this.armThickness / 2;
    for (const side of ["left", "right"] as const) {
      if (!(side === "left" ? parts.leftArm : parts.rightArm)) {
        continue;
      }
      const sign = side === "left" ? -1 : 1;
      const arm = Sprite.from(
        side === "left" ? textures.leftArm : textures.rightArm,
      );
      arm.anchor.set(0.5);
      const hand = Sprite.from(
        side === "left" ? textures.leftHand : textures.rightHand,
      );
      hand.anchor.set(0.5);
      const spot = choose(...HAND_SPOTS);
      const shoulder = V(0, sign * shoulderOffset);
      this.arms.push({
        arm,
        hand,
        from: {
          shoulder: local({
            position: side === "left" ? from.leftShoulder : from.rightShoulder,
            angle: 0,
          }).position,
          hand: local(side === "left" ? from.leftHand : from.rightHand),
        },
        to: {
          shoulder,
          hand: {
            position: shoulder
              .add(V(spot.x, sign * spot.y))
              .iadd(V(rUniform(-0.04, 0.04), rUniform(-0.04, 0.04))),
            angle: rUniform(-1, 1),
          },
        },
      });
    }

    this.headFrom = local(from.head);
    this.headTo = { position: V(0.02, 0), angle: rUniform(-0.5, 0.5) };
    if (parts.head) {
      this.headSprite = Sprite.from(textures.head);
      this.headSprite.anchor.set(0.5);
      this.headSprite.scale.set(scale);
    }

    this.bodySprite.addChild(this.torsoSprite, this.standingTorsoSprite);
    if (this.legsSprite) {
      this.bodySprite.addChild(this.legsSprite);
    }
    for (const { arm, hand } of this.arms) {
      this.bodySprite.addChild(arm, hand);
    }
    if (this.headSprite) {
      this.bodySprite.addChild(this.headSprite);
    }

    // Stumps where parts came off
    if (!parts.head) {
      this.addStump(V(0.05, 0), radius * 0.6);
    }
    if (!parts.leftArm) {
      this.addStump(V(0, -shoulderOffset), this.armThickness * 1.6);
    }
    if (!parts.rightArm) {
      this.addStump(V(0, shoulderOffset), this.armThickness * 1.6);
    }

    // The pool of blood, bigger where it lost parts
    this.addPoolSplat(V(-0.3 * torsoLength, 0), radius * 3.2);
    if (!parts.head) {
      this.addPoolSplat(V(0.3, 0), radius * 2.4);
    }
    if (!parts.legs) {
      this.addPoolSplat(V(-0.9 * torsoLength, 0), radius * 2.6);
    }

    this.pose(0);
    this.updateTint();
  }

  /** A lump of red where a part came off */
  private addStump(position: V2d, size: number) {
    const stump = Sprite.from(choose(...BLOB_TEXTURES));
    stump.anchor.set(0.5);
    stump.position.copyFrom(position);
    stump.rotation = rUniform(0, Math.PI * 2);
    stump.width = size;
    stump.height = size;
    stump.tint = darken(BLOOD_COLOR, rUniform(0.3, 0.45));
    this.bodySprite.addChild(stump);
  }

  private addPoolSplat(position: V2d, size: number) {
    const sprite = Sprite.from(choose(...SPLAT_TEXTURES));
    sprite.anchor.set(0.5);
    sprite.position.copyFrom(position);
    sprite.rotation = rUniform(0, Math.PI * 2);
    sprite.tint = darken(BLOOD_COLOR, rUniform(0.4, 0.5));
    sprite.alpha = 0.9;
    // Burned bodies bleed less
    const bleeding = 1 - this.char * 0.6;
    this.poolSplats.push({ sprite, size: size * bleeding });
    this.pool.addChild(sprite);
    this.setPoolSize(0);
  }

  private setPoolSize(t: number) {
    for (const { sprite, size } of this.poolSplats) {
      sprite.scale.set((size * lerp(0.15, 1, t)) / sprite.texture.width);
    }
  }

  @on("add")
  async onAdd() {
    const burning = this.options.burning;
    if (burning && burning.timeLeft > 0) {
      ignite(this, burning.source, burning.timeLeft);
      this.burn();
    }
    await this.wait(FALL_TIME, (_, t) => this.pose(t * t));
    this.pose(1);
    // A slower start than it ends, like a spreading puddle
    await this.wait(POOL_TIME, (_, t) => this.setPoolSize(1 - (1 - t) ** 2));
  }

  /** Chars while it's on fire */
  private async burn() {
    await this.waitUntil(
      () => !this.burning,
      (dt) => {
        this.char = Math.min(1, this.char + dt / CHAR_TIME);
        this.updateTint();
      },
    );
  }

  private updateTint() {
    this.bodySprite.tint = colorLerp(this.baseTint, CHARRED_TINT, this.char);
  }

  /** Lays it out partway (0 to 1) from standing to lying down */
  private pose(t: number) {
    const lerpPose = (a: Pose, b: Pose, sprite: Sprite) => {
      sprite.position.copyFrom(a.position.lerp(b.position, t));
      sprite.rotation = a.angle + angleDelta(a.angle, b.angle) * t;
    };

    const torso: Pose = {
      position: this.torsoFrom.position.lerp(V(0, 0), t),
      angle: this.torsoFrom.angle + angleDelta(this.torsoFrom.angle, 0) * t,
    };
    // Fades from the standing torso to the one lying down
    for (const sprite of [this.torsoSprite, this.standingTorsoSprite]) {
      sprite.position.copyFrom(torso.position);
      sprite.rotation = torso.angle;
    }
    this.standingTorsoSprite.alpha = clamp(1 - t * 1.6);
    this.torsoSprite.alpha = clamp(t * 1.6);

    // The legs come out from under it
    const legs = this.legsSprite;
    if (legs) {
      lerpPose(
        { position: torso.position, angle: this.legsTo.angle },
        this.legsTo,
        legs,
      );
      legs.width = this.legsLength * lerp(0.3, 1, t);
      legs.alpha = clamp(t * 2);
    }

    if (this.headSprite) {
      lerpPose(this.headFrom, this.headTo, this.headSprite);
    }

    const thickness = lerp(this.armThicknessFrom, this.armThickness, t);
    for (const { arm, hand, from, to } of this.arms) {
      const shoulder = from.shoulder.lerp(to.shoulder, t);
      lerpPose(from.hand, to.hand, hand);
      const span = V(hand.position.x, hand.position.y).isub(shoulder);
      arm.position.copyFrom(shoulder.iaddScaled(span, 0.5));
      arm.rotation = span.angle;
      arm.width = span.magnitude;
      arm.height = thickness;
      hand.width = thickness;
      hand.height = thickness;
    }
  }

  /** The middle of the body, for the fire on it */
  getPosition(): V2d {
    return V(this.bodySprite.position.x, this.bodySprite.position.y);
  }

  takeBurnDamage() {}
}

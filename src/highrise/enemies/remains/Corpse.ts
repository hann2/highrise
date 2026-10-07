import { Container, Sprite, Texture } from "pixi.js";
import { Layer } from "../../../config/layers";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";
import { on } from "../../../core/entity/handler";
import { colorLerp, darken } from "../../../core/util/ColorUtils";
import { angleDelta, clamp, lerp } from "../../../core/util/MathUtil";
import { choose, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import {
  makeSleeve,
  type BodyPoses,
  type BodyTextures,
  type Sleeve,
} from "../../creature-stuff/BodySprite";
import {
  ArmPose,
  SLEEVE_BEND,
  sleeveStrip,
} from "../../creature-stuff/sleeveStrip";
import { limbJoints, lyingPose } from "../../looks/lyingPose";
import { HUMAN_RADIUS } from "../../constants/constants";
import { bodyPixelScale } from "../../looks/bakeBodies";
import { WET_RADIUS } from "../../effects/BloodSplat";
import {
  BLOOD_COLOR as BLOOD_STAIN_COLOR,
  getFloorStains,
} from "../../effects/FloorStains";
import { BLOB_TEXTURES, SPLAT_TEXTURES } from "../../effects/Splat";
import Burning, { Flammable, ignite } from "../../fire/Burning";
import type Human from "../../human/Human";

/** Seconds to fall from standing to lying down */
const FALL_TIME = 0.35;
/** Seconds for the pool of blood under it to spread */
const POOL_TIME = 4;
/** Seconds its pool is wet enough to track in footprints, drying all the while */
const POOL_WET_TIME = 120;
/** Seconds of burning to go from fresh to fully charred */
const CHAR_TIME = 4;
/** What a fully charred body is tinted */
export const CHARRED_TINT = 0x584840;
/** How red the blood is */
const BLOOD_COLOR = 0xff0000;

/** Where a limb's joints are: where it's attached, its elbow or knee, and its hand or ankle */
interface Joints {
  root: [number, number];
  middle: [number, number];
  end: [number, number];
}

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
  /** Its legs lying down, waist on the right; given, it has its legs */
  legs?: Texture;
  /** Half the width of the body lying down, in meters */
  radius: number;
  /** Where the shoulders end up */
  position: V2d;
  /** Which way the head ends up pointing */
  angle: number;
  /** Where its parts were when it died, to fall from */
  from: BodyPoses;
  /** The torso it had standing, to fade from, with where its anchor was */
  standingTorso: { texture: Texture; scale: number };
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
  /** Each arm bent at the elbow, and its hand */
  private arms: {
    strip: Sleeve;
    hand: Sprite;
    from: Joints;
    to: Joints;
    handFrom: number;
    handTo: number;
    upper: number;
    lower: number;
    bend: number;
  }[] = [];
  /** Each leg bent at the knee, and its shoe, and the seat over their tops */
  private legs: {
    strip: Sleeve;
    shoe: Sprite;
    side: number;
    from: Joints;
    to: Joints;
    foot: number;
    upper: number;
    lower: number;
    bend: number;
  }[] = [];
  private seat?: Sprite;
  private headFrom: Pose;
  private headTo: Pose;
  private torsoFrom: Pose;
  private scale: number;

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

    // Sized like a crawler, the shoulders at its middle
    const size = radius / HUMAN_RADIUS;
    const scale = bodyPixelScale(size);
    // Whole, its hem over its legs, or torn off at the waist without them
    const hasLegs = parts.legs && !!options.legs;
    this.torsoSprite = new Sprite(
      hasLegs ? (textures.wholeTorso ?? textures.torso) : textures.torso,
    );
    this.torsoSprite.scale.set(scale);
    const torsoLength = this.torsoSprite.width;
    this.torsoFrom = local(from.torso);

    const standing = options.standingTorso;
    this.standingTorsoSprite = new Sprite(standing.texture);
    this.standingTorsoSprite.scale.set(standing.scale);

    // How it lies: which way each limb's bent
    const pose = lyingPose(() => rUniform(0, 1));
    const metrics = textures.metrics;
    this.scale = scale;

    // The legs, bent at the knee, come out from under it as it falls
    const legParts = textures.legParts;
    if (hasLegs && legParts) {
      const waist = -metrics.lyingWaist * size;
      const thigh = metrics.lyingThigh * size;
      const shin = metrics.lyingShin * size;
      const bend = metrics.lyingLegThickness * size * 0.5;
      this.seat = new Sprite(legParts.seat);
      this.seat.scale.set(scale);
      this.seat.position.set(waist, 0);
      for (const side of [-1, 1] as const) {
        const i = side < 0 ? 0 : 1;
        const hip: [number, number] = [
          waist - metrics.lyingHipDrop * size,
          side * metrics.lyingHip * size,
        ];
        const { middle, end } = limbJoints(hip, pose.legs[i], thigh, shin);
        const tucked = (at: [number, number]): [number, number] => [
          hip[0] + (at[0] - hip[0]) * 0.3,
          hip[1] + (at[1] - hip[1]) * 0.3,
        ];
        const shoe = new Sprite(legParts.shoe);
        this.legs.push({
          strip: makeSleeve(
            side < 0 ? legParts.left : legParts.right,
            scale,
            thigh,
            bend,
          ),
          shoe,
          side,
          from: { root: hip, middle: tucked(middle), end: tucked(end) },
          to: { root: hip, middle, end },
          foot: pose.feet[i],
          upper: thigh,
          lower: shin,
          bend,
        });
      }
    }

    // The arms, bent at the elbow, from where they were standing
    const shoulderOffset = metrics.lyingShoulder * size;
    const upperArm = metrics.upperArm * size;
    const forearm = metrics.forearm * size;
    const armBend = metrics.armThickness * size * SLEEVE_BEND;
    for (const side of [-1, 1] as const) {
      if (!(side < 0 ? parts.leftArm : parts.rightArm)) {
        continue;
      }
      const i = side < 0 ? 0 : 1;
      const shoulder: [number, number] = [0, side * shoulderOffset];
      const { middle, end, endAngle } = limbJoints(
        shoulder,
        pose.arms[i],
        upperArm,
        forearm,
      );
      const standingShoulder = local({
        position: side < 0 ? from.leftShoulder : from.rightShoulder,
        angle: 0,
      }).position;
      const standingHand = local(side < 0 ? from.leftHand : from.rightHand);
      // Its elbow standing: halfway, out to the side
      const elbowFrom = standingShoulder
        .lerp(standingHand.position, 0.5)
        .iadd(V(0, side * 0.06 * size));
      const hand = new Sprite(
        side < 0 ? textures.leftHand : textures.rightHand,
      );
      hand.scale.set(scale);
      this.arms.push({
        strip: makeSleeve(
          side < 0 ? textures.leftArm : textures.rightArm,
          scale,
          upperArm,
          armBend,
          metrics.armJoint * size,
        ),
        hand,
        from: {
          root: [standingShoulder.x, standingShoulder.y],
          middle: [elbowFrom.x, elbowFrom.y],
          end: [standingHand.position.x, standingHand.position.y],
        },
        to: { root: shoulder, middle, end },
        handFrom: standingHand.angle,
        handTo: endAngle,
        upper: upperArm,
        lower: forearm,
        bend: armBend,
      });
    }

    this.headFrom = local(from.head);
    this.headTo = {
      position: V(textures.metrics.lyingHead * size, 0),
      angle: pose.head.angle,
    };
    if (parts.head) {
      // Turned to one side or the other
      this.headSprite = new Sprite(textures.turnedHead ?? textures.head);
      this.headSprite.scale.set(scale, pose.head.facesLeft ? -scale : scale);
    }

    // The legs, their shoes (under trouser legs, over bare ones) and the
    // seat over their tops, then the arms and their hands, all under the
    // torso, as standing, so the arms' round ends at the shoulders don't
    // show, and its hem's over the legs
    const bare = textures.metrics.lyingBareLegs;
    for (const leg of this.legs) {
      if (bare) {
        this.bodySprite.addChild(leg.strip.mesh, leg.shoe);
      } else {
        this.bodySprite.addChild(leg.shoe, leg.strip.mesh);
      }
    }
    if (this.seat) {
      this.bodySprite.addChild(this.seat);
    }
    for (const { strip, hand } of this.arms) {
      this.bodySprite.addChild(strip.mesh, hand);
    }
    this.bodySprite.addChild(this.torsoSprite, this.standingTorsoSprite);
    if (this.headSprite) {
      this.bodySprite.addChild(this.headSprite);
    }

    // Stumps where parts came off
    if (!parts.head) {
      this.addStump(V(0.05, 0), radius * 0.6);
    }
    if (!parts.leftArm) {
      this.addStump(V(0, -shoulderOffset), metrics.armThickness * size * 1.6);
    }
    if (!parts.rightArm) {
      this.addStump(V(0, shoulderOffset), metrics.armThickness * size * 1.6);
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
    // Wet as big as it'll spread, drying over `POOL_WET_TIME`
    const stains = getFloorStains(this.game);
    for (const { sprite, size } of this.poolSplats) {
      const where = V(sprite.position.x, sprite.position.y)
        .rotate(this.options.angle)
        .iadd(this.options.position);
      stains.spill(
        where,
        size * WET_RADIUS,
        BLOOD_STAIN_COLOR,
        1,
        POOL_WET_TIME,
      );
    }
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
    const lerpJoints = (from: Joints, to: Joints): ArmPose["shoulder"][] =>
      (["root", "middle", "end"] as const).map((joint) => [
        lerp(from[joint][0], to[joint][0], t),
        lerp(from[joint][1], to[joint][1], t),
      ]);
    const fadeIn = clamp(t * 2);
    if (this.seat) {
      this.seat.alpha = fadeIn;
    }
    for (const leg of this.legs) {
      const [hip, knee, ankle] = lerpJoints(leg.from, leg.to);
      this.bendStrip(
        leg.strip,
        hip,
        knee,
        ankle,
        leg.upper,
        leg.lower,
        leg.bend,
      );
      leg.strip.mesh.alpha = fadeIn;
      const shin = Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]);
      leg.shoe.position.set(ankle[0], ankle[1]);
      leg.shoe.rotation = shin + leg.foot * t;
      leg.shoe.scale.set(this.scale, this.scale * leg.side);
      leg.shoe.alpha = fadeIn;
    }

    if (this.headSprite) {
      lerpPose(this.headFrom, this.headTo, this.headSprite);
    }

    for (const arm of this.arms) {
      const [shoulder, elbow, hand] = lerpJoints(arm.from, arm.to);
      this.bendStrip(
        arm.strip,
        shoulder,
        elbow,
        hand,
        arm.upper,
        arm.lower,
        arm.bend,
      );
      arm.hand.position.set(hand[0], hand[1]);
      arm.hand.rotation =
        arm.handFrom + angleDelta(arm.handFrom, arm.handTo) * t;
    }
  }

  /** Lays a limb's strip along its joints */
  private bendStrip(
    strip: Sleeve,
    root: ArmPose["shoulder"],
    middle: ArmPose["shoulder"],
    end: ArmPose["shoulder"],
    upper: number,
    lower: number,
    bend: number,
  ) {
    sleeveStrip(
      strip.picture,
      {
        shoulder: root,
        elbow: middle,
        hand: end,
        upperArm: upper,
        forearm: lower,
        bend,
      },
      strip.along,
      strip.vertices,
    );
    strip.mesh.geometry.getBuffer("aPosition").update();
  }

  /** The middle of the body, for the fire on it */
  getPosition(): V2d {
    return V(this.bodySprite.position.x, this.bodySprite.position.y);
  }

  takeBurnDamage() {}
}

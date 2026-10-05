import { Container, Sprite } from "pixi.js";
import { BodyTextures, bodyPixelScale } from "../looks/bakeBodies";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { FootLanding, Gait, SIDES } from "../../core/animation/Gait";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { HUMAN_RADIUS } from "../constants/constants";
import { FOOT_FORWARD, HEM_OVERLAP, HIP_WIDTH, LegStyle } from "./Legs";
import FloorStains, { getFloorStains } from "../effects/FloorStains";
import { Shoes } from "./Shoes";

export type { BodyTextures } from "../looks/bakeBodies";

/**
 * How far (meters) beyond the edge of the view a body is still posed and
 * drawn, so nothing shows up unposed at the edge
 */
const VIEW_MARGIN = 1;

/** How much bigger a foot looks at the top of its swing, nearer the camera */
const FOOT_LIFT_SCALE = 0.15;
/** Radians the shoulders turn against the hips with each step, at full stride */
const TORSO_TWIST = 0.06;

// A body with arms that faces a direction
export abstract class BodySprite extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  torsoSprite: Sprite;
  headSprite: Sprite;
  leftArmSprite: Sprite;
  armThickness: number;
  /** From the middle to each shoulder joint, in meters */
  private shoulderOffset: number;
  private headRadius: number;
  rightArmSprite: Sprite;
  leftHandSprite: Sprite;
  rightHandSprite: Sprite;
  /** The legs and feet, under everything else; only for a body with `legs` */
  legsSprite?: Container;
  private legSprites: Sprite[] = [];
  private footSprites: Sprite[] = [];
  /** How the legs walk, worked out from how the body moves; only for a body with `legs` */
  readonly gait?: Gait;
  /** What's on its soles, which it leaves in prints; only for a body with `legs` */
  readonly shoes?: Shoes;
  /** Called as each foot comes down, after the shoes have had their say (for anything else that wants to know) */
  onFootLand?: (landing: FootLanding) => void;
  /** `game.simulatedTime` when the gait was last moved on */
  private gaitTime = 0;
  /** How big the legs are next to a human's */
  private legScale: number;
  /** Meters per texture pixel */
  private pixelScale: number;
  private legThickness = 0;

  constructor(
    readonly textures: BodyTextures,
    private radius: number,
    legs?: LegStyle,
  ) {
    super();

    this.sprite = new Container();
    this.legScale = radius / HUMAN_RADIUS;

    // Each part's texture is anchored where it attaches, and drawn at a
    // fixed number of pixels per meter, bigger or smaller with the body
    const scale = bodyPixelScale(this.legScale);
    this.pixelScale = scale;
    const { metrics } = textures;
    this.armThickness = metrics.armThickness * this.legScale;
    this.shoulderOffset = metrics.shoulderOffset * this.legScale;
    this.headRadius = metrics.headRadius * this.legScale;

    this.torsoSprite = new Sprite(textures.torso);
    this.torsoSprite.scale.set(scale);

    this.headSprite = new Sprite(textures.head);
    this.headSprite.scale.set(scale);

    // Stretched from the shoulder to the hand
    this.leftArmSprite = new Sprite(textures.leftArm);
    this.leftArmSprite.anchor.set(0.5, 0.5);
    this.leftArmSprite.scale.set(scale);
    this.rightArmSprite = new Sprite(textures.rightArm);
    this.rightArmSprite.anchor.set(0.5, 0.5);
    this.rightArmSprite.scale.set(scale);

    this.leftHandSprite = new Sprite(textures.leftHand);
    this.leftHandSprite.scale.set(scale);
    this.rightHandSprite = new Sprite(textures.rightHand);
    this.rightHandSprite.scale.set(scale);

    this.sprite.addChild(
      this.leftArmSprite,
      this.rightArmSprite,
      this.leftHandSprite,
      this.rightHandSprite,
      this.torsoSprite,
      this.headSprite,
    );

    if (legs) {
      this.gait = new Gait(legs.gait, HIP_WIDTH * this.legScale);
      const shoes = new Shoes(this.legScale);
      this.shoes = shoes;
      this.gait.onLand = (landing) => {
        shoes.land(
          landing,
          this.game.entities.getById("floorStains") as FloorStains | undefined,
          () => getFloorStains(this.game),
        );
        this.onFootLand?.(landing);
      };
      const { leg, leftFoot, rightFoot, thickness } = legs.textures;
      this.legThickness = thickness * this.legScale;
      this.legSprites = [leg, leg].map((texture) => {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.scale.set(scale);
        return sprite;
      });
      // Sides are in the gait's order: left, then right
      this.footSprites = [leftFoot, rightFoot].map(
        (texture) => new Sprite(texture),
      );
      this.legsSprite = new Container();
      // Feet under the legs, so the trouser hems cover the tops of the shoes
      this.legsSprite.addChild(...this.footSprites, ...this.legSprites);
      this.sprite.addChildAt(this.legsSprite, 0);
    }
  }

  /**
   * Poses the body where it is, unless it's out of view: then it isn't drawn,
   * and isn't posed either, since that's most of the cost of a body. Nothing
   * else may rely on the pose being up to date; `getPartPoses` updates it.
   * The walk cycle is only for looks too, so it's moved on here, by the game
   * time since it last was.
   */
  @on("render")
  onRender(_dt: number) {
    const inView = this.game.camera.isInView(
      this.getPosition(),
      this.radius + VIEW_MARGIN,
    );
    // Not `visible`, which the owner may use (enemies fade out of sight with it)
    this.sprite.renderable = inView;
    if (inView) {
      if (this.gait) {
        const now = this.game.simulatedTime;
        this.gait.update(
          this.getPosition(),
          this.getAngle(),
          now - this.gaitTime,
        );
        this.gaitTime = now;
      }
      this.updatePose();
    }
  }

  /** Puts the sprites where the body and its parts are now */
  updatePose() {
    this.sprite.position.copyFrom(this.getPosition());
    this.sprite.rotation = this.getAngle();

    this.torsoSprite.rotation = this.getStanceAngle() + this.getTorsoTwist();
    this.poseLegs();

    const [leftShoulderPos, rightShoulderPos] = this.getShoulderPositions();
    const [leftHandPos, rightHandPos] = this.getHandPositions();

    const leftArmPos = leftShoulderPos.lerp(leftHandPos, 0.5);
    const rightArmPos = rightShoulderPos.lerp(rightHandPos, 0.5);

    this.leftArmSprite.position.copyFrom(leftArmPos);
    this.rightArmSprite.position.copyFrom(rightArmPos);

    const leftArmSpan = leftHandPos.sub(leftShoulderPos);
    const rightArmSpan = rightHandPos.sub(rightShoulderPos);

    this.leftArmSprite.width = leftArmSpan.magnitude;
    this.rightArmSprite.width = rightArmSpan.magnitude;
    this.leftArmSprite.rotation = leftArmSpan.angle;
    this.rightArmSprite.rotation = rightArmSpan.angle;

    this.leftHandSprite.position.copyFrom(leftHandPos);
    this.rightHandSprite.position.copyFrom(rightHandPos);
  }

  /**
   * Puts the legs and feet where the walk cycle has them: each leg from its
   * hip to where its foot is on the floor. Standing square, they're under
   * the torso, so they aren't drawn at all.
   */
  private poseLegs() {
    const gait = this.gait;
    if (!gait || !this.legsSprite) {
      return;
    }
    this.legsSprite.visible = !gait.underBody;
    if (!this.legsSprite.visible) {
      return;
    }
    const scale = this.legScale;
    const [x, y] = this.getPosition();
    const facing = this.getAngle();
    // From the world into the body's own frame, which the container turns with it
    const cos = Math.cos(-facing);
    const sin = Math.sin(-facing);
    const footForward = FOOT_FORWARD * scale;
    for (const side of SIDES) {
      const step = gait.feet[side];
      const hipDX = gait.hipX(side) - x;
      const hipDY = gait.hipY(side) - y;
      const hipX = hipDX * cos - hipDY * sin;
      const hipY = hipDX * sin + hipDY * cos;
      const ankleX = (step.x - x) * cos - (step.y - y) * sin;
      const ankleY = (step.x - x) * sin + (step.y - y) * cos;

      const leg = this.legSprites[side];
      const spanX = ankleX - hipX;
      const spanY = ankleY - hipY;
      const span = Math.sqrt(spanX * spanX + spanY * spanY);
      // From half its thickness behind the hip to a little past the ankle
      const behindHip = this.legThickness / 2;
      const pastAnkle = this.legThickness * HEM_OVERLAP;
      const shift = span > 0.0001 ? (pastAnkle - behindHip) / 2 / span : 0;
      leg.position.set(
        (hipX + ankleX) / 2 + spanX * shift,
        (hipY + ankleY) / 2 + spanY * shift,
      );
      leg.rotation = span > 0.01 ? Math.atan2(spanY, spanX) : 0;
      leg.width = span + behindHip + pastAnkle;

      const foot = this.footSprites[side];
      const angle = step.angle - facing;
      const size = this.pixelScale * (1 + step.lift * FOOT_LIFT_SCALE);
      foot.position.set(
        ankleX + Math.cos(angle) * footForward,
        ankleY + Math.sin(angle) * footForward,
      );
      foot.rotation = angle;
      foot.scale.set(size);
    }
  }

  /** The shoulders turning a little against the hips with each step */
  getTorsoTwist(): number {
    const gait = this.gait;
    return gait
      ? Math.sin(gait.phase * Math.PI * 2) * TORSO_TWIST * gait.stride
      : 0;
  }

  // Override me!
  getPosition() {
    return V(0, 0);
  }

  // Override me!
  getAngle() {
    return 0;
  }

  // Override me!
  getStanceAngle(): number {
    return 0;
  }

  getShoulderPositions(): [V2d, V2d] {
    const stanceAngle = this.getStanceAngle();
    const r = this.shoulderOffset;
    return [
      polarToVec(stanceAngle - Math.PI / 2, r),
      polarToVec(stanceAngle + Math.PI / 2, r),
    ];
  }

  getHandPositions(): [V2d, V2d] {
    return this.getShoulderPositions();
  }

  /** A point in the body's own coordinates, in the world, as of the last pose */
  toWorld(local: V2d): V2d {
    const { x, y } = this.sprite.position;
    return local.rotate(this.sprite.rotation).iadd([x, y]);
  }

  /** Where each part of the body is in the world and which way it points */
  getPartPoses(): BodyPoses {
    this.updatePose();
    const pose = (part: Sprite): PartPose => ({
      position: this.toWorld(V(part.position.x, part.position.y)),
      angle: this.sprite.rotation + part.rotation,
    });
    const [leftShoulder, rightShoulder] = this.getShoulderPositions();
    return {
      head: pose(this.headSprite),
      torso: pose(this.torsoSprite),
      leftArm: pose(this.leftArmSprite),
      rightArm: pose(this.rightArmSprite),
      leftHand: pose(this.leftHandSprite),
      rightHand: pose(this.rightHandSprite),
      leftShoulder: this.toWorld(leftShoulder),
      rightShoulder: this.toWorld(rightShoulder),
      headRadius: this.headRadius,
      armThickness: this.armThickness,
    };
  }
}

export interface PartPose {
  position: V2d;
  angle: number;
}

/** Where a body's parts were, for taking it apart (see `getPartPoses`) */
export interface BodyPoses {
  head: PartPose;
  torso: PartPose;
  leftArm: PartPose;
  rightArm: PartPose;
  leftHand: PartPose;
  rightHand: PartPose;
  leftShoulder: V2d;
  rightShoulder: V2d;
  headRadius: number;
  armThickness: number;
}

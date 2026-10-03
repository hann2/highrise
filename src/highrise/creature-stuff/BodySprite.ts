import { Container, Sprite } from "pixi.js";
import { ImageName } from "../../../resources/resources";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { Gait } from "../../core/animation/Gait";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { HUMAN_RADIUS } from "../constants/constants";
import {
  FOOT_FORWARD,
  FOOT_LENGTH,
  FOOT_WIDTH,
  HIP_WIDTH,
  LEG_THICKNESS,
  LegStyle,
} from "./Legs";

export interface BodyTextures {
  head: ImageName;
  torso: ImageName;
  leftHand: ImageName;
  rightHand: ImageName;
  leftArm: ImageName;
  rightArm: ImageName;
}

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
  rightArmSprite: Sprite;
  leftHandSprite: Sprite;
  rightHandSprite: Sprite;
  /** The legs and feet, under everything else; only for a body with `legs` */
  legsSprite?: Container;
  private legSprites: Sprite[] = [];
  private footSprites: Sprite[] = [];
  /** How the legs walk, worked out from how the body moves; only for a body with `legs` */
  readonly gait?: Gait;
  /** How big the legs are next to a human's */
  private legScale: number;

  constructor(
    readonly textures: BodyTextures,
    private radius: number,
    legs?: LegStyle,
  ) {
    super();

    this.sprite = new Container();
    this.legScale = radius / HUMAN_RADIUS;

    this.torsoSprite = Sprite.from(textures.torso);
    this.torsoSprite.anchor.set(0.5);
    const baseScale = (this.radius * 2) / this.torsoSprite.height;
    this.torsoSprite.scale.set(baseScale);

    this.headSprite = Sprite.from(textures.head);
    this.headSprite.anchor.set(0.5);
    this.headSprite.scale.copyFrom(this.torsoSprite.scale); // because we know we're exporting them at the same resolution

    this.leftArmSprite = Sprite.from(textures.leftArm);
    this.armThickness = baseScale * this.leftArmSprite.height; // To use for shoulder positioning
    this.leftArmSprite.anchor.set(0.5, 0.5);
    this.leftArmSprite.height = this.armThickness;

    this.rightArmSprite = Sprite.from(textures.rightArm);
    this.rightArmSprite.anchor.set(0.5, 0.5);
    this.rightArmSprite.height = this.armThickness;

    this.leftHandSprite = Sprite.from(textures.leftHand);
    this.leftHandSprite.anchor.set(0.5, 0.5);
    this.leftHandSprite.width = this.armThickness;
    this.leftHandSprite.height = this.armThickness;

    this.rightHandSprite = Sprite.from(textures.rightHand);
    this.rightHandSprite.anchor.set(0.5, 0.5);
    this.rightHandSprite.width = this.armThickness;
    this.rightHandSprite.height = this.armThickness;

    this.sprite.addChild(
      this.leftArmSprite,
      this.rightArmSprite,
      this.leftHandSprite,
      this.rightHandSprite,
      this.torsoSprite,
      this.headSprite,
    );

    if (legs) {
      this.gait = new Gait(legs.gait);
      const pair = (image: "leg" | "foot", color: string) =>
        [0, 1].map(() => {
          const sprite = Sprite.from(image);
          sprite.anchor.set(0.5);
          sprite.tint = color;
          return sprite;
        });
      this.legSprites = pair("leg", legs.colors.pants);
      this.footSprites = pair("foot", legs.colors.shoes);
      this.legsSprite = new Container();
      this.legsSprite.addChild(...this.legSprites, ...this.footSprites);
      this.sprite.addChildAt(this.legsSprite, 0);
    }
  }

  /** Moves the walk cycle on by how far the body went. Subclasses that tick call this. */
  @on("tick")
  onTick(dt: number) {
    this.gait?.update(this.getPosition(), this.getAngle(), dt);
  }

  /**
   * Poses the body where it is, unless it's out of view: then it isn't drawn,
   * and isn't posed either, since that's most of the cost of a body. Nothing
   * else may rely on the pose being up to date; `getPartPoses` updates it.
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

  /** Puts the legs and feet where the walk cycle has them */
  private poseLegs() {
    const gait = this.gait;
    if (!gait) {
      return;
    }
    const scale = this.legScale;
    const facing = this.getAngle();
    const hipAngle = gait.hipAngle - facing;
    const travelAngle = gait.travelAngle - facing;
    for (const side of [0, 1] as const) {
      const hip = polarToVec(
        hipAngle + (side === 0 ? -Math.PI / 2 : Math.PI / 2),
        HIP_WIDTH * scale,
      );
      const step = gait.foot(side);
      const ankle = hip.add(polarToVec(travelAngle, step.along));

      const leg = this.legSprites[side];
      const span = ankle.sub(hip);
      leg.position.copyFrom(hip.lerp(ankle, 0.5));
      leg.rotation = span.magnitude > 0.01 ? span.angle : hipAngle;
      leg.width = span.magnitude + LEG_THICKNESS * scale;
      leg.height = LEG_THICKNESS * scale;

      const foot = this.footSprites[side];
      const lift = 1 + step.lift * FOOT_LIFT_SCALE;
      foot.position.copyFrom(
        ankle.iadd(polarToVec(hipAngle, FOOT_FORWARD * scale)),
      );
      foot.rotation = hipAngle;
      foot.width = FOOT_LENGTH * scale * lift;
      foot.height = FOOT_WIDTH * scale * lift;
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
    const r = this.radius - this.armThickness / 2;
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
      headRadius: this.headSprite.height / 2,
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

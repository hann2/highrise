import { Container, Sprite } from "pixi.js";
import { ImageName } from "../../../resources/resources";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";

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

  constructor(
    readonly textures: BodyTextures,
    private radius: number,
  ) {
    super();

    this.sprite = new Container();

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

    this.torsoSprite.rotation = this.getStanceAngle();

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

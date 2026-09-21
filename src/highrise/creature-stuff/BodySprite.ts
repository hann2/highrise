import { Container, Sprite } from "pixi.js";
import { ImageName } from "../../../resources/resources";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
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
    textures: BodyTextures,
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

  onRender(dt: number) {
    this.sprite.position.copyFrom(this.getPosition());
    this.sprite.rotation = this.getAngle();

    this.torsoSprite.rotation = this.getStanceAngle();

    const stanceOffset = this.getStanceOffset();
    this.torsoSprite.position.copyFrom(stanceOffset);
    this.headSprite.position.copyFrom(stanceOffset);

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

  // Override me!
  getStanceOffset() {
    return V(0, 0);
  }

  getShoulderPositions(): [V2d, V2d] {
    const stanceAngle = this.getStanceAngle();
    const offset = this.getStanceOffset();
    const r = this.radius - this.armThickness / 2;
    return [
      polarToVec(stanceAngle - Math.PI / 2, r).iadd(offset),
      polarToVec(stanceAngle + Math.PI / 2, r).iadd(offset),
    ];
  }

  getHandPositions(): [V2d, V2d] {
    return this.getShoulderPositions();
  }
}

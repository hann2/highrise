import { Sprite } from "pixi.js";
import img_zombieHead from "../../../resources/images/zombies/zombie-head.png";
import img_zombieLeftArm from "../../../resources/images/zombies/zombie-left-arm.png";
import img_zombieLeftHand from "../../../resources/images/zombies/zombie-left-hand.png";
import img_zombieRightArm from "../../../resources/images/zombies/zombie-right-arm.png";
import img_zombieRightHand from "../../../resources/images/zombies/zombie-right-hand.png";
import img_zombieTorso from "../../../resources/images/zombies/zombie-torso.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { angleDelta, polarToVec, smoothStep } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../constants";
import Zombie from "./Zombie";

export const ZOMBIE_TEXTURES = {
  torso: img_zombieTorso,
  head: img_zombieHead,
  leftArm: img_zombieLeftArm,
  rightArm: img_zombieRightArm,
  leftHand: img_zombieLeftHand,
  rightHand: img_zombieRightHand,
};

// Renders a zombie
export default class ZombieSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  headSprite: Sprite;
  torsoSprite: Sprite;
  leftArmSprite: Sprite;
  rightArmSprite: Sprite;
  leftHandSprite: Sprite;
  rightHandSprite: Sprite;

  armThickness: number;
  handSize = 0.2;

  constructor(private zombie: Zombie) {
    super();

    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.5);

    const textures = ZOMBIE_TEXTURES;

    this.torsoSprite = Sprite.from(textures.torso);
    this.torsoSprite.anchor.set(0.5);
    const baseScale = ZOMBIE_RADIUS / this.torsoSprite.width;
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
    this.leftHandSprite.width = this.handSize;
    this.leftHandSprite.height = this.handSize;

    this.rightHandSprite = Sprite.from(textures.rightHand);
    this.rightHandSprite.anchor.set(0.5, 0.5);
    this.rightHandSprite.width = this.handSize;
    this.rightHandSprite.height = this.handSize;

    this.sprite.addChild(this.leftArmSprite);
    this.sprite.addChild(this.rightArmSprite);
    this.sprite.addChild(this.leftHandSprite);
    this.sprite.addChild(this.rightHandSprite);
    this.sprite.addChild(this.torsoSprite);
    this.sprite.addChild(this.headSprite);
  }

  get stanceAngle(): number {
    return angleDelta(this.zombie.targetDirection, this.zombie.body.angle);
  }

  onRender(dt: number) {
    [this.sprite.x, this.sprite.y] = this.zombie.body.position;
    this.sprite.rotation = this.zombie.body.angle;

    this.torsoSprite.rotation = this.stanceAngle;

    const [leftShoulderPos, rightShoulderPos] = this.getShoulderPositions();
    const [leftHandPos, rightHandPos] = this.getHandPositions();

    const leftArmPos = leftShoulderPos.lerp(leftHandPos, 0.5);
    const rightArmPos = rightShoulderPos.lerp(rightHandPos, 0.5);

    this.leftArmSprite.position.set(...leftArmPos);
    this.rightArmSprite.position.set(...rightArmPos);

    const leftArmSpan = leftHandPos.sub(leftShoulderPos);
    const rightArmSpan = rightHandPos.sub(rightShoulderPos);

    this.leftArmSprite.width = leftArmSpan.magnitude;
    this.rightArmSprite.width = rightArmSpan.magnitude;
    this.leftArmSprite.rotation = leftArmSpan.angle;
    this.rightArmSprite.rotation = rightArmSpan.angle;

    this.leftHandSprite.position.set(...leftHandPos);
    this.rightHandSprite.position.set(...rightHandPos);
  }

  getShoulderPositions(): [V2d, V2d] {
    const stanceAngle = this.stanceAngle;
    const r = HUMAN_RADIUS - this.armThickness / 2;
    return [
      polarToVec(stanceAngle - Math.PI / 2, r),
      polarToVec(stanceAngle + Math.PI / 2, r),
    ];
  }

  getHandPositions(): [V2d, V2d] {
    // Wave em in the air like you just don't care?

    const shoulders = this.getShoulderPositions();

    const t = smoothStep(this.zombie.attackPhasePercent);

    switch (this.zombie.attackPhase) {
      case "ready": {
        const [leftOffset, rightOffset] = idlePositions;
        return [shoulders[0].iadd(leftOffset), shoulders[1].iadd(rightOffset)];
      }
      case "windup": {
        return lerpOffsets(shoulders, idlePositions, attackStartPositions, t);
      }
      case "attack": {
        return lerpOffsets(
          shoulders,
          attackStartPositions,
          attackEndPositions,
          t
        );
      }
      case "winddown": {
        return lerpOffsets(shoulders, attackEndPositions, cooldownPositions, t);
      }
      case "cooldown": {
        return lerpOffsets(shoulders, cooldownPositions, idlePositions, t);
      }
    }
  }
}

function lerpOffsets(
  [leftBase, rightBase]: [V2d, V2d],
  [leftStart, rightStart]: [V2d, V2d],
  [leftEnd, rightEnd]: [V2d, V2d],
  t: number
): [V2d, V2d] {
  const leftOffset = leftStart.lerp(leftEnd, t);
  const rightOffset = rightStart.lerp(rightEnd, t);
  return [leftBase.iadd(leftOffset), rightBase.iadd(rightOffset)];
}

const idlePositions: [V2d, V2d] = [V(0.3, 0), V(0.3, 0)];
const attackStartPositions: [V2d, V2d] = [V(0.4, -0.2), V(0.4, 0.2)];
const attackEndPositions: [V2d, V2d] = [V(0.4, 0.12), V(0.4, -0.12)];
const cooldownPositions: [V2d, V2d] = [V(0.25, 0.1), V(0.25, -0.1)];

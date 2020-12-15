import { Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import {
  clamp,
  degToRad,
  lerpOrSnap,
  polarToVec,
  stepToward,
} from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { HUMAN_RADIUS } from "../../constants";
import Gun from "../../weapons/Gun";
import { FireMode } from "../../weapons/GunStats";
import MeleeWeapon from "../../weapons/MeleeWeapon";
import Human, { PUSH_COOLDOWN } from "./Human";

const GUN_SCALE = 1 / 300;
const STANCE_ADJUST_SPEED = 3; // meters per second
const STANCE_ROTATE_SPEED = Math.PI * 2; // radians per second

// Renders a human
export default class HumanSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  weaponSprite?: Sprite;

  headSprite: Sprite;
  torsoSprite: Sprite;
  leftArmSprite: Sprite;
  rightArmSprite: Sprite;
  leftHandSprite: Sprite;
  rightHandSprite: Sprite;

  armThickness: number;
  handSize = 0.2;

  stanceAngle: number = 0;
  stanceOffset: [number, number] = [0, 0];

  constructor(private human: Human) {
    super();

    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.5);

    const textures = human.character.textures;

    this.torsoSprite = Sprite.from(textures.torso);
    this.torsoSprite.anchor.set(0.5);
    const baseScale = HUMAN_RADIUS / this.torsoSprite.width;
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

  onRender(dt: number) {
    const { body, weapon } = this.human;
    [this.sprite.x, this.sprite.y] = body.position;
    this.sprite.rotation = body.angle;

    this.stanceAngle = stepToward(
      this.stanceAngle,
      this.getTargetStanceAngle(),
      dt * STANCE_ROTATE_SPEED
    );

    const targetStanceOffset = this.getTargetStanceOffset();
    this.stanceOffset[0] = stepToward(
      this.stanceOffset[0],
      targetStanceOffset[0],
      dt * STANCE_ADJUST_SPEED
    );
    this.stanceOffset[1] = stepToward(
      this.stanceOffset[1],
      targetStanceOffset[1],
      dt * STANCE_ADJUST_SPEED
    );

    this.stanceAngle = this.torsoSprite.rotation = this.stanceAngle;
    this.torsoSprite.position.set(...this.stanceOffset);
    this.headSprite.position.set(...this.stanceOffset);

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

    if (weapon instanceof MeleeWeapon && this.weaponSprite) {
      this.weaponSprite.visible = weapon.currentCooldown <= 0;
      const swaySpeed = 2 * Math.PI * 1.5;
      const swayAmount = degToRad(3);
      const sway = Math.sin(this.game!.elapsedTime * swaySpeed) * swayAmount;
      this.weaponSprite.rotation = weapon.swing.restAngle + sway + Math.PI / 2;
    } else if (weapon instanceof Gun && this.weaponSprite) {
      const xOffset = this.getRecoilOffset(weapon);
      const [baseX, baseY] = weapon.stats.holdPosition;
      this.weaponSprite.position.set(baseX + xOffset, baseY);
    }
  }

  getTargetStanceAngle(): number {
    if (this.human.weapon instanceof Gun) {
      return this.human.weapon.stats.stanceAngle;
    } else {
      return 0;
    }
  }

  getTargetStanceOffset(): [number, number] {
    if (this.human.weapon instanceof Gun) {
      return this.human.weapon.stats.stanceOffset;
    } else {
      return [0, 0];
    }
  }

  getShoulderPositions(): [V2d, V2d] {
    const stanceAngle = this.stanceAngle;
    const offset = this.stanceOffset;
    const r = HUMAN_RADIUS - this.armThickness / 2;
    return [
      polarToVec(stanceAngle - Math.PI / 2, r).iadd(offset),
      polarToVec(stanceAngle + Math.PI / 2, r).iadd(offset),
    ];
  }

  getRecoilOffset(gun: Gun): number {
    return -0.125 * gun.getCurrentRecoilAmount() ** 1.5;
  }

  getHandPositions(): [V2d, V2d] {
    const { weapon } = this.human;
    if (weapon instanceof Gun) {
      const gun = weapon;
      const recoilOffset = this.getRecoilOffset(gun);
      const pumpOffset = -0.2 * gun.pumpAmount;
      const [leftX, leftY] = gun.stats.leftHandPosition;
      const [rightX, rightY] = gun.stats.rightHandPosition;

      return [
        V(leftX + recoilOffset + pumpOffset, leftY),
        V(rightX + recoilOffset, rightY),
      ];
    } else if (weapon instanceof MeleeWeapon) {
      if (weapon.currentSwing) {
        const t = weapon.currentSwing.attackProgress;
        const p = weapon.swing.getHandlePosition(t);
        return [p, p];
      } else {
        const p = V(weapon.swing.restPosition);
        return [p, p];
      }
    } else {
      // Wave em in the air like you just don't care?
      const x = 0.1 + clamp(this.human.pushCooldown / PUSH_COOLDOWN) * 0.4;
      const y = Math.sin(this.game!.elapsedTime * 2) * 0.05;
      return [V(x, -0.2 + y), V(x, 0.2 - y)];
    }
  }

  async onGiveWeapon(weapon: Gun | MeleeWeapon) {
    if (weapon instanceof Gun) {
      const { textures, muzzleLength } = weapon.stats;
      this.weaponSprite = Sprite.from(textures.holding);
      this.weaponSprite.scale.set(GUN_SCALE);
      this.weaponSprite.anchor.set(0.5, 0.5);
      this.weaponSprite.position.set(...weapon.stats.holdPosition);
      this.sprite.addChild(this.weaponSprite);
    } else if (weapon instanceof MeleeWeapon) {
      const { handlePosition, textures, size } = weapon.stats;
      const { restAngle, restPosition } = weapon.swing;

      this.weaponSprite = Sprite.from(textures.hold);
      this.weaponSprite.scale.set(size[1] / this.weaponSprite.height);
      this.weaponSprite.anchor.set(...handlePosition);
      this.weaponSprite.rotation = Math.PI / 2 + restAngle;
      this.weaponSprite.position.set(...restPosition);
      this.sprite.addChild(this.weaponSprite);
    } else {
      // This should never happen
    }
  }

  onDropWeapon() {
    if (this.weaponSprite) {
      this.sprite.removeChild(this.weaponSprite);
      this.weaponSprite = undefined;
    }
  }
}

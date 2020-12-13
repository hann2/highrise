import { Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { colorLerp } from "../../../core/util/ColorUtils";
import { clamp, degToRad } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import Gun from "../../weapons/Gun";
import MeleeWeapon from "../../weapons/MeleeWeapon";
import Human, { HUMAN_RADIUS } from "./Human";

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

  armThickness = 0.2;
  handSize = 0.24;

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

  onRender() {
    const { body, hp, weapon } = this.human;
    [this.sprite.x, this.sprite.y] = body.position;
    this.sprite.rotation = body.angle;

    const healthPercent = clamp(hp / 100);
    this.torsoSprite.tint = colorLerp(0xff0000, 0xffffff, healthPercent);
    this.headSprite.tint = colorLerp(0xff0000, 0xffffff, healthPercent);

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
    }
  }

  getShoulderPositions(): [V2d, V2d] {
    const y = HUMAN_RADIUS - this.armThickness / 2;
    return [V(0, -y), V(0, y)];
  }

  getHandPositions(): [V2d, V2d] {
    const { weapon } = this.human;
    if (weapon instanceof Gun) {
      const gun = weapon;
      return [V(gun.stats.leftHandPosition), V(gun.stats.rightHandPosition)];
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
      const y = Math.sin(this.game!.elapsedTime * 2) * 0.05;
      return [V(0.2, -0.2 + y), V(0.2, 0.2 - y)];
    }
  }

  async onGiveWeapon(weapon: Gun | MeleeWeapon) {
    if (weapon instanceof Gun) {
      const { textures, muzzleLength } = weapon.stats;
      this.weaponSprite = Sprite.from(textures.holding);
      this.weaponSprite.scale.set(
        1 / 64 // TODO: sprite size
      );
      this.weaponSprite.anchor.set(1, 0.5);
      this.weaponSprite.position.set(muzzleLength, 0);
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

import { Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { colorLerp } from "../../../core/util/ColorUtils";
import { clamp } from "../../../core/util/MathUtil";
import Gun from "../guns/Gun";
import Hittable from "../Hittable";
import MeleeWeapon from "../meleeWeapons/MeleeWeapon";
import WeaponPickup from "../WeaponPickup";
import Human, { HUMAN_RADIUS } from "./Human";

// Renders a human
export default class HumanSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  holdSprite: Sprite;
  standSprite: Sprite;
  gunSprite: Sprite;
  reloadSprite: Sprite;
  weaponSprite?: Sprite;

  constructor(private human: Human) {
    super();

    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.5);

    this.reloadSprite = Sprite.from(human.character.imageReload);
    this.gunSprite = Sprite.from(human.character.imageGun);
    this.standSprite = Sprite.from(human.character.imageStand);
    this.holdSprite = Sprite.from(human.character.imageHold);

    for (const bodySprite of this.getBodySprites()) {
      bodySprite.anchor.set(0.5, 0.5);
      bodySprite.scale.set((2 * HUMAN_RADIUS) / bodySprite.height);
      this.sprite.addChild(bodySprite);
    }
  }

  // TODO: Guarantee that this happens after everyone else's render calls. Why?
  onRender() {
    const { body, hp, weapon } = this.human;
    [this.sprite.x, this.sprite.y] = body.position;
    this.sprite.rotation = body.angle;

    const currentBodySprite = this.getCurrentBodySprite();

    for (const s of this.getBodySprites()) {
      s.visible = s === currentBodySprite;
    }

    const healthPercent = clamp(hp / 100);
    currentBodySprite.tint = colorLerp(0xff0000, 0xffffff, healthPercent);

    if (weapon instanceof MeleeWeapon) {
      this.weaponSprite!.visible = weapon.currentCooldown <= 0;
    }
  }

  getCurrentBodySprite() {
    const { weapon } = this.human;
    if (weapon instanceof Gun) {
      if (weapon.isReloading) {
        return this.reloadSprite;
      } else {
        return this.gunSprite;
      }
    } else if (weapon instanceof MeleeWeapon) {
      return this.holdSprite;
    } else {
      return this.standSprite;
    }
  }

  getBodySprites() {
    return [
      this.holdSprite,
      this.gunSprite,
      this.reloadSprite,
      this.standSprite,
    ];
  }

  async giveWeapon(weapon: Gun | MeleeWeapon) {
    if (weapon instanceof MeleeWeapon) {
      const { handlePosition, pickupTexture, size, swing } = weapon.stats;
      const { restAngle, restPosition } = weapon.swing;

      this.weaponSprite = Sprite.from(pickupTexture);
      this.weaponSprite.scale.set(size[1] / this.weaponSprite.height);
      this.weaponSprite.anchor.set(...handlePosition);
      this.weaponSprite.rotation = Math.PI / 2 + restAngle;
      this.weaponSprite.position.set(...restPosition);
      this.sprite.addChild(this.weaponSprite);
    }
  }

  dropWeapon() {
    if (this.weaponSprite) {
      this.sprite.removeChild(this.weaponSprite);
      this.weaponSprite = undefined;
    }
  }
}

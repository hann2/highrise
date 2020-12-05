import { Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { colorLerp } from "../../../core/util/ColorUtils";
import { clamp } from "../../../core/util/MathUtil";
import Gun from "../guns/Gun";
import MeleeWeapon from "../meleeWeapons/MeleeWeapon";
import Human, { HUMAN_RADIUS } from "./Human";

interface BodySprites {
  holding: Sprite;
  standing: Sprite;
  gun: Sprite;
  reloading: Sprite;
}

// Renders a human
export default class HumanSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  bodySprites: BodySprites;
  weaponSprite?: Sprite;

  constructor(private human: Human) {
    super();

    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.5);

    this.bodySprites = {
      reloading: Sprite.from(human.character.imageReload),
      gun: Sprite.from(human.character.imageGun),
      standing: Sprite.from(human.character.imageStand),
      holding: Sprite.from(human.character.imageHold),
    };

    for (const bodySprite of Object.values(this.bodySprites)) {
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

    for (const s of Object.values(this.bodySprites)) {
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
        return this.bodySprites.reloading;
      } else {
        return this.bodySprites.gun;
      }
    } else if (weapon instanceof MeleeWeapon) {
      return this.bodySprites.holding;
    } else {
      return this.bodySprites.standing;
    }
  }

  async onGiveWeapon(weapon: Gun | MeleeWeapon) {
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

  onDropWeapon() {
    if (this.weaponSprite) {
      this.sprite.removeChild(this.weaponSprite);
      this.weaponSprite = undefined;
    }
  }
}

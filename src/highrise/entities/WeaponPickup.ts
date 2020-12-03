import { Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import { rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Gun from "./guns/Gun";
import Human from "./Human";
import Interactable from "./Interactable";
import MeleeWeapon from "./meleeWeapons/MeleeWeapon";
import { GameSprite } from "../../core/entity/Entity";
import { Layers } from "../layers";

export default class WeaponPickup extends BaseEntity {
  sprite?: Sprite & GameSprite;

  constructor(position: V2d, private weapon: Gun | MeleeWeapon) {
    super();

    this.addChild(weapon, true); // Take ownership of the gun. This is a little weird
    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    if (weapon.stats.pickupTexture && weapon.stats.weaponLength) {
      this.sprite = Sprite.from(weapon.stats.pickupTexture);
      this.sprite.scale.set(weapon.stats.weaponLength / this.sprite.height);
      this.sprite.anchor.set(0.5, 0.5);
      this.sprite.position.set(...position);
      this.sprite.rotation = rUniform(0, Math.PI * 2);
    } else {
      const textSprite = new Text("", {
        font: "5px Snippet",
        fill: "yellow",
        align: "left",
      });
      textSprite.anchor.set(0.5, 0.5);
      textSprite.position.set(...position);
      textSprite.text = this.weapon.stats.name.substr(0, 1);
      textSprite.scale.set(0.03);
      this.sprite = textSprite;
    }

    this.sprite.layerName = Layers.WORLD_BACK;
  }

  onInteract(human: Human) {
    human.giveWeapon(this.weapon);
    this.destroy();
  }
}

import { Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import { V2d } from "../../core/Vector";
import Gun from "./guns/Gun";
import Human from "./Human";
import Interactable from "./Interactable";
import MeleeWeapon from "./meleeWeapons/MeleeWeapon";

export default class WeaponPickup extends BaseEntity {
  sprite?: Sprite;

  constructor(position: V2d, private weapon: Gun | MeleeWeapon) {
    super();

    this.addChild(weapon, true); // Take ownership of the gun. This is a little weird
    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    // Sorry Simon
    if (weapon instanceof MeleeWeapon) {
      this.sprite = Sprite.from(weapon.stats.texture);
      this.sprite.scale.set(weapon.stats.weaponLength / this.sprite.height);
      this.sprite.anchor.set(0.5, 0.5);
      this.sprite.position.set(...position);
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
  }

  onInteract(human: Human) {
    human.giveWeapon(this.weapon);
    // TODO: Play sound effect
    this.destroy();
  }
}

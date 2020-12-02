import { Body } from "p2";
import { Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import { V2d } from "../../core/Vector";
import Gun from "./guns/Gun";
import Human from "./Human";
import Interactable from "./Interactable";
import MeleeWeapon from "./meleeWeapons/MeleeWeapon";

export default class WeaponPickup extends BaseEntity {
  sprite?: Text;

  constructor(position: V2d, private weapon: Gun | MeleeWeapon) {
    super();

    this.addChild(weapon, true); // Take ownership of the gun. This is a little weird
    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    this.sprite = new Text("", {
      font: "5px Snippet",
      fill: "yellow",
      align: "left",
    });
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(...position);
    this.sprite.text = this.weapon.stats.name.substr(0, 1);
    this.sprite.scale.set(0.03);
  }

  onInteract(human: Human) {
    human.giveWeapon(this.weapon);
    // TODO: Play sound effect
    this.destroy();
  }
}

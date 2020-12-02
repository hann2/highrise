import { Body } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Graphics, ObservablePoint, Text } from "pixi.js";
import Interactable from "./Interactable";
import Human from "./Human";
import { V2d } from "../../core/Vector";
import Gun from "./guns/Gun";

export default class GunPickup extends BaseEntity {
  sprite: Text;

  constructor(position: V2d, private gun: Gun) {
    super();

    this.addChild(gun, true); // Take ownership of the gun. This is a little weird
    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    this.sprite = new Text("", {
      font: "5px Snippet",
      fill: "yellow",
      align: "left",
    });
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(...position);
    this.sprite.text = this.gun.stats.name.substr(0, 1);
    this.sprite.scale.set(0.03);
  }

  onInteract(human: Human) {
    human.giveGun(this.gun);
    // TODO: Play sound effect
    this.destroy();
  }
}

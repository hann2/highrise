import { Body } from "p2";
import { Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import { V2d } from "../../core/Vector";
import Human from "./Human";
import Interactable from "./Interactable";

export default class HealthPickup extends BaseEntity {
  sprite: Text;

  constructor(position: V2d) {
    super();

    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    this.sprite = new Text("", {
      font: "5px Snippet",
      fill: "yellow",
      align: "left",
    });
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(...position);
    this.sprite.text = "+";
    this.sprite.scale.set(0.03);

    this.body = new Body({
      mass: 0,
      position: position,
    });
  }

  onInteract(human: Human) {
    human.heal(100);
    this.destroy();
  }
}

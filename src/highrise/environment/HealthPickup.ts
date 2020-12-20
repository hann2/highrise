import { Body } from "p2";
import { Sprite } from "pixi.js";
import img_healthPack from "../../../resources/images/health_pack.png";
import BaseEntity from "../../core/entity/BaseEntity";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";
import Interactable from "./Interactable";
import { GameSprite } from "../../core/entity/Entity";
import { Layer } from "../config/layers";

export default class HealthPickup extends BaseEntity {
  sprite: Sprite & GameSprite;

  constructor(position: V2d) {
    super();

    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    this.sprite = Sprite.from(img_healthPack);
    this.sprite.scale.set(0.7 / this.sprite.width);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(...position);
    this.sprite.layerName = Layer.ITEMS;

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
import { Sprite } from "pixi.js";
import img_healthKit from "../../../resources/images/health-kit.png";
import BaseEntity from "../../core/entity/BaseEntity";
import { GameSprite } from "../../core/entity/Entity";
import { rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import Human from "../human/Human";
import Interactable from "./Interactable";

export default class HealthPickup extends BaseEntity {
  sprite: Sprite & GameSprite;

  constructor(position: V2d) {
    super();

    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    this.sprite = Sprite.from(img_healthKit);
    this.sprite.scale.set(0.45 / this.sprite.width);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(...position);
    this.sprite.rotation = rUniform(0, Math.PI * 2);
    this.sprite.layerName = Layer.ITEMS;
  }

  onInteract(human: Human) {
    human.heal(100);
    this.destroy();
  }
}

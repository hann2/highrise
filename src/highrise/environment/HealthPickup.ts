import { Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import { GameSprite } from "../../core/entity/GameSprite";
import { rDirection } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";
import Interactable from "./Interactable";

export default class HealthPickup extends BaseEntity {
  sprite: Sprite & GameSprite;

  constructor(position: V2d) {
    super();

    const interactable = this.addChild(
      new Interactable(position, this.handleInteract.bind(this)),
    );
    interactable.prompt = () => ({ title: "Health kit" });

    this.sprite = Sprite.from("healthKit");
    this.sprite.scale.set(0.45 / this.sprite.width);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.copyFrom(position);
    this.sprite.rotation = rDirection();
    this.sprite.layerName = Layer.ITEMS;
  }

  handleInteract(human: Human) {
    human.heal(100);
    this.destroy();
  }
}

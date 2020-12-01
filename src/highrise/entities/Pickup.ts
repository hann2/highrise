import { Body } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Graphics, ObservablePoint, Text } from "pixi.js";
import Interactable from "./Interactable";
import Human from "./Human";
import { V2d } from "../../core/Vector";

export default class Pickup extends BaseEntity implements Entity, Interactable {
  sprite: GameSprite;
  grantItem: (human: Human) => void;

  constructor(p: V2d, grantItem: (human: Human) => void, id: string) {
    super();

    this.grantItem = grantItem;

    const graphics = new Graphics();
    const textSample = new Text(id, {
      font: "5px Snippet",
      fill: "yellow",
      align: "left",
    });
    textSample.position.set(...p);
    textSample.scale = new ObservablePoint(() => {}, null, 0.03, 0.03);
    graphics.addChild(textSample);

    this.sprite = graphics;

    this.body = new Body({
      mass: 0,
      position: p,
    });
  }

  interact(human: Human): boolean {
    this.grantItem(human);
    this.destroy();
    return true;
  }
}

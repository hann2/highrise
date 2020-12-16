import { Body, Box } from "p2";
import { Sprite } from "pixi.js";
import img_stairs from "../../../resources/images/environment/stairs.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { V } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import Interactable from "./Interactable";

export default class Exit extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    direction: number
  ) {
    super();

    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    this.sprite = Sprite.from(img_stairs);
    this.sprite.layerName = Layer.DECORATIONS;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(x1 + w / 2, y1 + h / 2);
    this.sprite.width = w;
    this.sprite.height = h;
    this.sprite.rotation = direction;

    const position = V(Math.min(x1, x2) + w / 2, Math.min(y1, y2) + h / 2);
    this.body = new Body({
      mass: 0,
      position,
      collisionResponse: false,
    });

    const shape = new Box({ width: w, height: h });
    shape.collisionGroup = CollisionGroups.Sensors;
    shape.collisionMask = CollisionGroups.Humans;
    this.body.addShape(shape, [0, 0], 0);

    this.addChild(
      new Interactable(position, () => {
        this.game!.dispatch({ type: "levelComplete" });
      })
    );
  }
}

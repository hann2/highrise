import { Body, Box } from "p2";
import { Graphics, Point } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { V } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { Layers } from "../layers";
import Interactable from "./Interactable";

export default class Exit extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    super();

    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    this.sprite = new Graphics();
    this.sprite.layerName = Layers.WORLD_BACK;
    this.sprite.position.set(0, 0);
    this.sprite.beginFill(0x00ffff);
    this.sprite.drawRect(x1, y1, x2 - x1, y2 - y1);
    this.sprite.endFill();

    const position = V(Math.min(x1, x2) + w / 2, Math.min(y1, y2) + h / 2);
    this.body = new Body({
      mass: 0,
      position,
      collisionResponse: false,
    });

    const shape = new Box({ width: w, height: h });
    shape.collisionGroup = CollisionGroups.Sensors;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape, [0, 0], 0);

    this.addChild(
      new Interactable(position, () => {
        this.game!.dispatch({ type: "levelComplete" });
      })
    );
  }
}

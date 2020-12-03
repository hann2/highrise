import { Sprite } from "pixi.js";
import pointLight from "../../../resources/images/point-light.png";
import { V, V2d } from "../../core/Vector";
import Light from "./Light";

export class DirectionalLight extends Light {
  constructor(radius: number = 1, angle: number = 0) {
    super();

    const sprite = Sprite.from(pointLight);
    sprite.anchor.set(0.5, 0.5);
    this.lightSprite.addChild(sprite);

    sprite.width = radius * 2;
    sprite.height = radius * 2;
  }

  setPosition([x, y]: [number, number]) {
    this.lightSprite.position.set(x, y);
  }

  setDirection(direction: number) {
    this.lightSprite.rotation = direction;
  }

  getPosition(): V2d {
    return V(this.lightSprite.x, this.lightSprite.y);
  }
}

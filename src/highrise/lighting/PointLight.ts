import { BLEND_MODES, Sprite } from "pixi.js";
import pointLight from "../../../resources/images/point-light.png";
import { V, V2d } from "../../core/Vector";
import Light from "./Light";

export class PointLight extends Light {
  constructor(radius: number = 1) {
    super();

    this.lightSprite = Sprite.from(pointLight);
    this.lightSprite.blendMode = BLEND_MODES.ADD;
    this.lightSprite.anchor.set(0.5, 0.5);

    this.lightSprite.width = radius * 2;
    this.lightSprite.height = radius * 2;
  }

  setPosition([x, y]: [number, number]) {
    this.lightSprite.position.set(x, y);
  }

  getPosition(): V2d {
    return V(this.lightSprite.x, this.lightSprite.y);
  }
}

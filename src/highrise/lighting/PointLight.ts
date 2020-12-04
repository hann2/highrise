import { Sprite } from "pixi.js";
import pointLight from "../../../resources/images/point-light.png";
import { V, V2d } from "../../core/Vector";
import Light from "./Light";

export class PointLight extends Light {
  constructor(
    radius: number = 1,
    intensity: number = 1.0,
    color: number = 0xffffff
  ) {
    super(Sprite.from(pointLight));
    this.lightSprite.anchor.set(0.5, 0.5);

    this.setRadius(radius);
    this.setIntensity(intensity);
    this.setColor(color);
  }

  setPosition([x, y]: [number, number]) {
    this.lightSprite.position.set(x, y);
  }

  setIntensity(value: number) {
    this.lightSprite.alpha = value;
  }

  setRadius(radius: number) {
    this.lightSprite.width = radius * 2;
    this.lightSprite.height = radius * 2;
  }

  setColor(value: number) {
    this.lightSprite.tint = value;
  }

  getPosition(): V2d {
    return V(this.lightSprite.x, this.lightSprite.y);
  }
}

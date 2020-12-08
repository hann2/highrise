import { Sprite } from "pixi.js";
import pointLight from "../../../resources/images/lights/point-light.png";
import Light from "./Light";

export class PointLight extends Light {
  constructor(
    private radius: number = 1,
    intensity: number = 1.0,
    color: number = 0xffffff,
    shadowsEnabled: boolean = false,
    position?: [number, number]
  ) {
    super(Sprite.from(pointLight), shadowsEnabled, position);
    this.lightSprite.anchor.set(0.5, 0.5);

    this.setRadius(radius);
    this.setIntensity(intensity);
    this.setColor(color);

    position && this.setPosition(position);
  }

  setRadius(radius: number) {
    this.radius = radius;
    this.shadows?.setRadius(radius);
    this.lightSprite.width = radius * 2;
    this.lightSprite.height = radius * 2;
  }

  getShadowRadius() {
    return this.radius;
  }
}

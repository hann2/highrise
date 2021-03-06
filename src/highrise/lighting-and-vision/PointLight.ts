import { BLEND_MODES, Sprite } from "pixi.js";
import img_pointLight from "../../../resources/images/lights/point-light.png";
import Light from "./Light";

export interface PointLightOptions {
  radius?: number;
  intensity?: number;
  color?: number;
  shadowsEnabled?: boolean;
  softShadows?: boolean;
  position?: [number, number];
}

export class PointLight extends Light {
  constructor({
    radius = 1,
    intensity = 1.0,
    color = 0xffffff,
    shadowsEnabled = true,
    softShadows = false,
    position,
  }: PointLightOptions) {
    super(Sprite.from(img_pointLight), shadowsEnabled, radius, softShadows);
    this.lightSprite.anchor.set(0.5, 0.5);
    this.lightSprite.blendMode = BLEND_MODES.ADD;

    this.setRadius(radius);
    this.setIntensity(intensity);
    this.setColor(color);

    position && this.setPosition(position);
  }

  setRadius(radius: number) {
    this.dirty = true;
    this.shadowRadius = radius;
    this.shadows?.setRadius(radius);

    this.lightSprite.width = radius * 2;
    this.lightSprite.height = radius * 2;

    this.resizeBakedTexture();
  }
}

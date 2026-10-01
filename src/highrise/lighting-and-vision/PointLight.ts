import { Sprite } from "pixi.js";
import Light from "./Light";

export interface PointLightOptions {
  radius?: number;
  intensity?: number;
  color?: number;
  shadowsEnabled?: boolean;
  /** Soft shadows with a source radius proportional to the light's radius */
  softShadows?: boolean;
  /** Radius of the light source in meters, for soft shadows. Overrides softShadows. */
  sourceRadius?: number;
  position?: [number, number];
  /** Drawn every frame, for a light that moves or changes all the time (see `Light`) */
  dynamic?: boolean;
}

/** Source radius as a fraction of the light radius, when softShadows is set */
const SOFTNESS = 0.08;

export class PointLight extends Light {
  constructor({
    radius = 1,
    intensity = 1.0,
    color = 0xffffff,
    shadowsEnabled = true,
    softShadows = false,
    sourceRadius = softShadows ? radius * SOFTNESS : 0,
    position,
    dynamic = false,
  }: PointLightOptions) {
    const sprite = Sprite.from("pointLight");
    super(sprite, shadowsEnabled, radius, sourceRadius, radius * 2);
    sprite.anchor.set(0.5, 0.5);
    this.lightSprite.blendMode = "add";
    this.dynamic = dynamic;

    this.setRadius(radius);
    this.setIntensity(intensity);
    this.setColor(color);

    if (position) {
      this.setPosition(position);
    }
  }

  setRadius(radius: number) {
    this.invalidate();
    this.lightSprite.width = radius * 2;
    this.lightSprite.height = radius * 2;

    this.setSize(radius * 2);
  }
}

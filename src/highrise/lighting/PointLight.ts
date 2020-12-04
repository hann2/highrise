import { Sprite } from "pixi.js";
import pointLight from "../../../resources/images/point-light.png";
import { V, V2d } from "../../core/Vector";
import Light from "./Light";
import { Shadows } from "./Shadows";

export class PointLight extends Light {
  shadow?: Shadows;

  constructor(
    private radius: number = 1,
    intensity: number = 1.0,
    color: number = 0xffffff,
    private shadowsEnabled: boolean = false
  ) {
    super(Sprite.from(pointLight));
    this.lightSprite.anchor.set(0.5, 0.5);

    this.setRadius(radius);
    this.setIntensity(intensity);
    this.setColor(color);

    if (shadowsEnabled) {
      this.enableShadows();
    }
  }

  enableShadows() {
    this.shadowsEnabled = true;
    if (!this.shadow) {
      const { x, y } = this.lightSprite.position;
      this.shadow = this.addChild(new Shadows(V(x, y), this.radius));
      this.lightSprite.mask = this.shadow.shadowGraphics;
    }
  }

  disableShadows() {
    this.shadowsEnabled = false;
    this.shadow?.destroy();
    this.shadow = undefined;
    this.lightSprite.mask = null;
  }

  setPosition([x, y]: [number, number]) {
    this.lightSprite.position.set(x, y);
    this.shadow?.setPosition(V(x, y));
  }

  setIntensity(value: number) {
    this.lightSprite.alpha = value;
  }

  setRadius(radius: number) {
    this.radius = radius;
    this.shadow?.setRadius(radius);
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

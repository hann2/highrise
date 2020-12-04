import { Graphics } from "pixi.js";
import { degToRad } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import Light from "./Light";
import * as Pixi from "pixi.js";

export class DirectionalLight extends Light {
  graphics: Graphics;
  constructor(
    private _length: number = 1,
    private _width: number = degToRad(30),
    intensity: number = 1.0,
    color: number = 0xffffff
  ) {
    super();

    this.setIntensity(intensity);
    this.setColor(color);

    this.graphics = new Graphics();
    this.lightSprite.addChild(this.graphics);

    this.graphics.filters = [new Pixi.filters.BlurFilter(20)];
    this.redraw();
  }

  set length(value: number) {
    this._length = value;
    this.redraw();
  }

  get length() {
    return this._length;
  }

  set width(value: number) {
    this._width = value;
    this.redraw();
  }

  get width() {
    return this._width;
  }

  redraw() {
    const theta = this.width / 2;
    const length = this.length;

    this.graphics.clear();
    this.graphics.beginFill(0xffffff);
    this.graphics.moveTo(0, 0);
    this.graphics.lineTo(Math.cos(theta) * length, Math.sin(theta) * length);
    this.graphics.lineTo(Math.cos(-theta) * length, Math.sin(-theta) * length);
    this.graphics.lineTo(0, 0);
    this.graphics.endFill();
  }

  setPosition([x, y]: [number, number]) {
    this.lightSprite.position.set(x, y);
  }

  setDirection(angle: number) {
    this.lightSprite.rotation = angle;
  }

  setIntensity(value: number) {
    this.lightSprite.alpha = value;
  }

  setColor(value: number) {
    this.lightSprite.tint = value;
  }

  getPosition(): V2d {
    return V(this.lightSprite.x, this.lightSprite.y);
  }
}

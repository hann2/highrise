import { BlurFilter, Graphics } from "pixi.js";
import { degToRad } from "../../core/util/MathUtil";
import Light from "./Light";

export class DirectionalLight extends Light {
  graphics: Graphics;
  constructor(
    private _length: number = 1,
    private _width: number = degToRad(30),
    intensity: number = 1.0,
    color: number = 0xffffff,
    shadowsEnabled: boolean = true,
  ) {
    super(undefined, shadowsEnabled);

    this.setIntensity(intensity);
    this.setColor(color);

    // TODO: Use a shader I think, instead of graphics and filter
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);

    this.graphics.filters = [new BlurFilter({ strength: 2 })];
    this.redraw();
  }

  set length(value: number) {
    this._length = value;
    this.redraw();
  }

  get length() {
    return this._length;
  }

  set spread(value: number) {
    this._width = value;
    this.redraw();
  }

  get spread() {
    return this._width;
  }

  redraw() {
    const theta = this.spread / 2;
    const length = this.length;

    this.graphics
      .clear()
      .moveTo(0, 0)
      .lineTo(Math.cos(theta) * length, Math.sin(theta) * length)
      .lineTo(Math.cos(-theta) * length, Math.sin(-theta) * length)
      .lineTo(0, 0)
      .fill(0xffffff);
  }

  setDirection(angle: number) {
    this.graphics.rotation = angle;
  }

  getShadowRadius() {
    return this.length;
  }
}

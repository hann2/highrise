import { BlurFilter, Graphics } from "pixi.js";
import { degToRad, polarToVec } from "../../core/util/MathUtil";
import Light from "./Light";

export class DirectionalLight extends Light {
  graphics: Graphics;

  constructor(
    private _length: number = 1,
    private _spread: number = degToRad(30),
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
    this._spread = value;
    this.redraw();
  }

  get spread() {
    return this._spread;
  }

  redraw() {
    const left = polarToVec(this.spread / 2, this.length);
    const right = polarToVec(-this.spread / 2, this.length);

    this.graphics
      .clear()
      .poly([0, 0, left.x, left.y, right.x, right.y])
      .fill(0xffffff);
  }

  setDirection(angle: number) {
    this.graphics.rotation = angle;
  }

  getShadowRadius() {
    return this.length;
  }
}

import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { degToRad } from "../../core/util/MathUtil";
import { DirectionalLight } from "../lighting-and-vision/DirectionalLight";
import Human from "./Human";

/** How far the flashlight reaches with no upgrades, in meters */
const BASE_LENGTH = 8;

/** A flashlight that follows a human's aim */
export default class Flashlight extends BaseEntity implements Entity {
  light: DirectionalLight;
  private length = BASE_LENGTH;

  constructor(private human: Human) {
    super();
    this.light = this.addChild(makeLight(this.length));
  }

  toggle() {
    this.light.enabled = !this.light.enabled;
  }

  @on("render")
  onRender() {
    // The light's size is baked into its texture, so a new range needs a new light
    const length = BASE_LENGTH * this.human.stats.flashlightRange;
    if (length !== this.length) {
      this.length = length;
      const enabled = this.light.enabled;
      this.light.destroy();
      this.light = this.addChild(makeLight(length));
      this.light.enabled = enabled;
    }

    // Only rebakes when the human actually moved or turned
    this.light.setPosition(this.human.getPosition());
    this.light.setDirection(this.human.getDirection());
  }
}

function makeLight(length: number): DirectionalLight {
  return new DirectionalLight({
    length,
    spread: degToRad(35),
    intensity: 0.7,
    color: 0xfff1d6,
    sourceRadius: 0.1,
  });
}

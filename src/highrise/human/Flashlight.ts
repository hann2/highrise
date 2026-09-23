import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { degToRad } from "../../core/util/MathUtil";
import { DirectionalLight } from "../lighting-and-vision/DirectionalLight";
import Human from "./Human";

/** A flashlight that follows a human's aim */
export default class Flashlight extends BaseEntity implements Entity {
  light: DirectionalLight;

  constructor(private human: Human) {
    super();
    this.light = this.addChild(
      new DirectionalLight({
        length: 8,
        spread: degToRad(35),
        intensity: 0.7,
        color: 0xfff1d6,
        sourceRadius: 0.1,
      }),
    );
  }

  toggle() {
    this.light.enabled = !this.light.enabled;
  }

  @on("render")
  onRender() {
    // Only rebakes when the human actually moved or turned
    this.light.setPosition(this.human.getPosition());
    this.light.setDirection(this.human.getDirection());
  }
}

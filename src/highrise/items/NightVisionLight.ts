import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import type Human from "../human/Human";
import { PointLight } from "../lighting-and-vision/PointLight";

/** How far, and how brightly, night vision lights things around its wearer */
const RADIUS = 12;
const INTENSITY = 0.25;

/** The Night Vision boss item: a dim, wide, green light that follows its wearer */
export default class NightVisionLight extends BaseEntity implements Entity {
  private light: PointLight;

  constructor(private human: Human) {
    super();
    this.light = this.addChild(
      new PointLight({
        radius: RADIUS,
        intensity: INTENSITY,
        color: 0x99ff99,
        position: [...human.getPosition()] as [number, number],
        dynamic: true,
      }),
    );
  }

  @on("render")
  onRender() {
    const [x, y] = this.human.getPosition();
    this.light.setPosition([x, y]);
  }
}

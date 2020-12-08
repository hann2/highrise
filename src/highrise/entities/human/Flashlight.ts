import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { degToRad } from "../../../core/util/MathUtil";
import { DirectionalLight } from "../../lighting/DirectionalLight";
import { PointLight } from "../../lighting/PointLight";
import Human from "./Human";

export default class Flashlight extends BaseEntity implements Entity {
  pointLight?: PointLight;
  directinoalLight?: DirectionalLight;

  constructor(public human: Human) {
    super();

    this.pointLight = this.addChild(new PointLight(10, 1, 0xffffff, true));
    // this.directinoalLight = this.addChild(
    //   new DirectionalLight(8, degToRad(35), 0.3, 0x00ffff)
    // );
  }

  afterPhysics() {
    const { position, angle } = this.human.body;
    this.pointLight?.setPosition(position);
    this.directinoalLight?.setPosition(position);
    this.directinoalLight?.setDirection(angle);
  }
}

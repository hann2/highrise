import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import {
  PointLight,
  PointLightOptions,
} from "../../lighting-and-vision/PointLight";

// This is basically a wrapper around point light, but it lets us select by
// this type of light and do things with them in the future (e.g. power flicker, power surge)
export class OverheadLight extends BaseEntity implements Entity {
  constructor(position: V2d, options: PointLightOptions = {}) {
    super();

    this.addChild(
      new PointLight({
        position,
        radius: 5,
        intensity: 0.9,
        shadowsEnabled: true,
        softShadows: true,
        color: 0xffffff,
        ...options,
      })
    );
  }
}

export function isOverheadLight(e: Entity): e is OverheadLight {
  return e instanceof OverheadLight;
}

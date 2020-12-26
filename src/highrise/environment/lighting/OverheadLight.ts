import snd_lightsClickOn from "../../../../resources/audio/environment/lights-click-on.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { V2d } from "../../../core/Vector";
import {
  PointLight,
  PointLightOptions,
} from "../../lighting-and-vision/PointLight";

// This is basically a wrapper around point light, but it lets us select by
// this type of light and do things with them in the future (e.g. power flicker, power surge)
export class OverheadLight extends BaseEntity implements Entity {
  constructor(
    public position: V2d,
    public options: PointLightOptions = {},
    startsOn: boolean = true
  ) {
    super();

    if (startsOn) {
      this.addLight();
    } else {
      this.handlers = {
        lightsOn: ({ position: lightPosition }) =>
          this.onLightSwitchEvent(lightPosition),
      };
    }
  }

  onLightSwitchEvent(lightPosition: V2d) {
    const delta = lightPosition.sub(this.position);
    const infiniteNorm = Math.max(Math.abs(delta.x), Math.abs(delta.y));
    const delayTime = infiniteNorm * 0.5;
    this.wait(delayTime).then(() => this.turnLightOn());
  }

  turnLightOn() {
    this.addLight();
    this.addChild(
      new PositionalSound(snd_lightsClickOn, this.position, { gain: 0.1 })
    );
  }

  addLight() {
    this.addChild(
      new PointLight({
        position: this.position,
        radius: 5,
        intensity: 0.9,
        shadowsEnabled: true,
        color: 0xffffff,
        ...this.options,
      })
    );
  }
}

export function isOverheadLight(e: Entity): e is OverheadLight {
  return e instanceof OverheadLight;
}

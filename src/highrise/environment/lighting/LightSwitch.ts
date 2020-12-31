import { Graphics } from "pixi.js";
import snd_heavySwitchThrow from "../../../../resources/audio/environment/heavy-switch-throw.flac";
import snd_lightPowerOn1 from "../../../../resources/audio/environment/light-power-on-1.wav";
import snd_powerWarmUp1 from "../../../../resources/audio/environment/power-warm-up-1.flac";
import snd_machineLoop1 from "../../../../resources/audio/moms-kitchen/machine-loop-1.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { V, V2d } from "../../../core/Vector";
import { Persistence } from "../../constants/constants";
import { PointLight } from "../../lighting-and-vision/PointLight";
import Interactable from "../Interactable";

const SWITCH_BOX_DIMENSIONS = V(0.3, 0.2);

export const MACHINE_SOUNDS = [
  snd_powerWarmUp1,
  snd_heavySwitchThrow,
  snd_machineLoop1,
  snd_lightPowerOn1,
];

export class LightSwitch extends BaseEntity implements Entity {
  sprite: Graphics;
  light: PointLight;
  on: boolean = false;

  constructor(public position: V2d, public direction: number) {
    super();

    this.light = this.addChild(new PointLight({ position, color: 0xff0000 }));
    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    const corner = position.sub(SWITCH_BOX_DIMENSIONS.mul(0.5));
    this.sprite = new Graphics();
    this.sprite.beginFill(0xaaaaaa);
    this.sprite.drawRect(
      corner.x,
      corner.y,
      SWITCH_BOX_DIMENSIONS.x,
      SWITCH_BOX_DIMENSIONS.y
    );
    this.sprite.endFill();
    this.sprite.rotation = direction;
  }

  async onInteract() {
    if (this.on) {
      return;
    }
    this.on = true;
    this.light.setColor(0x00ff00);
    this.addChild(new PositionalSound(snd_heavySwitchThrow, this.position));
    await this.wait(0.8);
    this.addChild(new PositionalSound(snd_powerWarmUp1, this.position));
    const loop = this.addChild(
      new PositionalSound(snd_machineLoop1, this.position, {
        continuous: true,
        persistenceLevel: Persistence.Floor,
        gain: 0,
      })
    );
    this.game!.dispatch({ type: "lightsOn", position: this.position });

    await this.wait(0.5, (dt, t) => {
      loop.gain = t;
    });
  }
}

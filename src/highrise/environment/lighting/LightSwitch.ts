import { Graphics } from "pixi.js";
import { SoundName } from "../../../../resources/resources";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { V, V2d } from "../../../core/Vector";
import { Persistence } from "../../constants/constants";
import { PointLight } from "../../lighting-and-vision/PointLight";
import Interactable from "../Interactable";

const SWITCH_BOX_DIMENSIONS = V(0.3, 0.2);

export const MACHINE_SOUNDS: SoundName[] = [
  "powerWarmUp1",
  "heavySwitchThrow",
  "machineLoop1",
  "lightPowerOn1",
];

export class LightSwitch extends BaseEntity implements Entity {
  sprite: Graphics;
  light: PointLight;
  on: boolean = false;

  constructor(
    public position: V2d,
    public direction: number,
  ) {
    super();

    this.light = this.addChild(new PointLight({ position, color: 0xff0000 }));
    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    const corner = position.sub(SWITCH_BOX_DIMENSIONS.mul(0.5));
    this.sprite = new Graphics();
    this.sprite
      .rect(
        corner.x,
        corner.y,
        SWITCH_BOX_DIMENSIONS.x,
        SWITCH_BOX_DIMENSIONS.y,
      )
      .fill(0xaaaaaa);
    this.sprite.rotation = direction;
  }

  async onInteract() {
    if (this.on) {
      return;
    }
    this.on = true;
    this.light.setColor(0x00ff00);
    this.addChild(new PositionalSound("heavySwitchThrow", this.position));
    await this.wait(0.8);
    this.addChild(new PositionalSound("powerWarmUp1", this.position));
    const loop = this.addChild(
      new PositionalSound("machineLoop1", this.position, {
        continuous: true,
        persistenceLevel: Persistence.Floor,
        gain: 0,
      }),
    );
    this.game!.dispatch("lightsOn", { position: this.position });

    await this.wait(0.5, (dt, t) => {
      loop.gain = t;
    });
  }
}

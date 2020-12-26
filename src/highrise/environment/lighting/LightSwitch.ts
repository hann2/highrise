import { Graphics } from "pixi.js";
import snd_heavySwitch from "../../../../resources/audio/environment/heavy-switch.flac";
import snd_powerOn from "../../../../resources/audio/environment/power-on.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { V, V2d } from "../../../core/Vector";
import { PointLight } from "../../lighting-and-vision/PointLight";
import Interactable from "../Interactable";

const SWITCH_BOX_DIMENSIONS = V(0.3, 0.2);

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

  onInteract() {
    if (this.on) {
      return;
    }
    this.on = true;
    this.light.setColor(0x00ff00);
    this.addChild(new PositionalSound(snd_heavySwitch, this.position));
    this.wait(0.8)
      .then(() =>
        this.addChild(new PositionalSound(snd_powerOn, this.position))
      )
      .then(() =>
        this.game!.dispatch({ type: "lightsOn", position: this.position })
      );
  }
}

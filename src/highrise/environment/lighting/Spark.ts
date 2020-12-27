import { Graphics } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { PointLight } from "../../lighting-and-vision/PointLight";

export class Spark extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  light: PointLight;

  lifetime: number;
  position: V2d;
  renderPosition: V2d;

  constructor(position: V2d, public velocity: V2d, maxLifetime: number = 0.8) {
    super();

    this.lifetime = rNormal(maxLifetime / 2, maxLifetime / 6);

    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WEAPONS;

    this.light = this.addChild(
      new PointLight({
        position,
        radius: 1,
        intensity: 0.2,
        shadowsEnabled: true,
        color: 0xfffacd,
      })
    );

    this.position = position.clone();
    this.renderPosition = position.clone();
  }

  async onAdd() {
    // Make sure we don't have any infinitely living bullets around
    await this.wait(this.lifetime, undefined, "life_timer");
    this.destroy();
  }

  onTick(dt: number) {
    this.renderPosition.set(this.position);
    this.position.iaddScaled(this.velocity, dt);
  }

  onRender(dt: number) {
    const endPoint = this.velocity.mul(dt);

    this.sprite
      .clear()
      .lineStyle(0.03, 0xffaa00, 0.6)
      .moveTo(0, 0)
      .lineTo(endPoint[0], endPoint[1]);

    this.sprite.position.set(...this.renderPosition);
    this.light.setPosition(this.renderPosition);
  }
}

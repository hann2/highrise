import { Graphics } from "pixi.js";
import { Layer } from "../../../config/layers";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";
import { on } from "../../../core/entity/handler";
import { rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { PointLight } from "../../lighting-and-vision/PointLight";

export class Spark extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  light: PointLight;

  lifetime: number;
  position: V2d;
  renderPosition: V2d;

  constructor(
    position: V2d,
    public velocity: V2d,
    maxLifetime: number = 0.8,
  ) {
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
      }),
    );

    this.position = position.clone();
    this.renderPosition = position.clone();
  }

  @on("add")
  async onAdd() {
    // Make sure we don't have any infinitely living bullets around
    await this.wait(this.lifetime, undefined, "life_timer");
    this.destroy();
  }

  @on("tick")
  onTick(dt: number) {
    this.renderPosition.set(this.position);
    this.position.iaddScaled(this.velocity, dt);
  }

  @on("render")
  onRender(dt: number) {
    const endPoint = this.velocity.mul(dt);

    this.sprite
      .clear()
      .moveTo(0, 0)
      .lineTo(endPoint.x, endPoint.y)
      .stroke({ width: 0.03, color: 0xffaa00, alpha: 0.6 });

    this.sprite.position.copyFrom(this.renderPosition);
    this.light.setPosition(this.renderPosition);
  }
}

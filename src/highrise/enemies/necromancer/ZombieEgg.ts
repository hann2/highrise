import { Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { smoothStep } from "../../../core/util/MathUtil";
import { choose, rDirection, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { BLOB_TEXTURES } from "../../effects/Splat";
import Zombie from "../zombie/Zombie";

export class ZombieEgg extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  t: number = 0;

  constructor(public startPosition: V2d, public target: V2d) {
    super();

    this.sprite = Sprite.from(choose(...BLOB_TEXTURES));
    this.sprite.scale.set(0.45 / this.sprite.texture.width);
    this.sprite.rotation = rDirection();
  }

  async onAdd() {
    await this.wait(1.0, (dt, t) => {
      this.t = smoothStep(t);
    });
    this.land();
  }

  land() {
    this.game?.addEntity(new Zombie(this.target));
    this.destroy();
  }

  onRender() {
    const [x, y] = this.startPosition.lerp(this.target, this.t);
    this.sprite?.position.set(x, y);
  }
}

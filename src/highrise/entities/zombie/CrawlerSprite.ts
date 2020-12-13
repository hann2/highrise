import { Sprite } from "pixi.js";
import crawler from "../../../../resources/images/zombies/crawler.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { Layers } from "../../layers";
import Zombie, { ZOMBIE_RADIUS } from "./Zombie";

interface BodySprites {
  standing: Sprite;
  stunned: Sprite;
  walking: Sprite;
  windup: Sprite;
  winddown: Sprite;
}
export default class ZombieSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  bodySprites: BodySprites;

  constructor(public zombie: Zombie) {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layers.WORLD;
    this.sprite.anchor.set(0.5, 0.5);

    this.bodySprites = {
      standing: Sprite.from(crawler),
      stunned: Sprite.from(crawler),
      walking: Sprite.from(crawler),
      windup: Sprite.from(crawler),
      winddown: Sprite.from(crawler),
    };

    for (const bodySprite of Object.values(this.bodySprites)) {
      bodySprite.anchor.set(0.5, 0.5);
      bodySprite.scale.set((2 * ZOMBIE_RADIUS) / bodySprite.height);
      this.sprite.addChild(bodySprite);
    }
  }

  onRender() {
    const { body } = this.zombie;
    [this.sprite.x, this.sprite.y] = body.position;
    this.sprite.rotation = body.angle;

    const currentBodySprite = this.getCurrentBodySprite();

    for (const s of Object.values(this.bodySprites)) {
      s.visible = s === currentBodySprite;
    }
  }

  getCurrentBodySprite() {
    const { attackPhase, isStunned } = this.zombie;
    if (isStunned) {
      return this.bodySprites.stunned;
    } else {
      switch (attackPhase) {
        case "cooldown":
        case "ready":
          return this.bodySprites.walking; // TODO: Idle
        case "windup":
        case "attack":
          return this.bodySprites.windup;
        case "winddown":
          return this.bodySprites.winddown;
      }
    }
  }
}

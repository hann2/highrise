import { vec2 } from "p2";
import { Sprite } from "pixi.js";
import img_crawler from "../../../../resources/images/zombies/crawler.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { rUniform } from "../../../core/util/Random";
import { Layers } from "../../layers";
import Zombie, { ZOMBIE_RADIUS } from "./Zombie";

const WIGGLE_SPEED = 12.0;
const WIGGLE_AMOUNT = 0.3;

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
  wigglePhase = rUniform(0, Math.PI * 2);

  constructor(public zombie: Zombie) {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layers.WORLD;
    this.sprite.anchor.set(0.5, 0.5);

    this.bodySprites = {
      standing: Sprite.from(img_crawler),
      stunned: Sprite.from(img_crawler),
      walking: Sprite.from(img_crawler),
      windup: Sprite.from(img_crawler),
      winddown: Sprite.from(img_crawler),
    };

    for (const bodySprite of Object.values(this.bodySprites)) {
      bodySprite.anchor.set(0.5, 0.5);
      bodySprite.scale.set((2 * ZOMBIE_RADIUS) / bodySprite.height);
      this.sprite.addChild(bodySprite);
    }
  }

  onTick(dt: number) {
    const moveSpeed = vec2.length(this.zombie.body.velocity);
    this.wigglePhase += moveSpeed * WIGGLE_SPEED * dt;
  }

  getWiggleAmount() {
    const t = this.wigglePhase;
    const sign = Math.sign(Math.sin(t));
    const p = sign * Math.abs(Math.sin(t));
    return p * WIGGLE_AMOUNT;
  }

  onRender() {
    const { body } = this.zombie;
    [this.sprite.x, this.sprite.y] = body.position;

    this.sprite.rotation = body.angle + this.getWiggleAmount();

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

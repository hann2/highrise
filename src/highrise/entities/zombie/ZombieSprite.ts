import { Sprite } from "pixi.js";
import zombie1Hold from "../../../../resources/images/zombies/zombie1_hold.png";
import zombie1Stand from "../../../../resources/images/zombies/zombie1_stand.png";
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
      standing: Sprite.from(zombie1Stand),
      stunned: Sprite.from(zombie1Stand),
      walking: Sprite.from(zombie1Hold),
      windup: Sprite.from(zombie1Hold),
      winddown: Sprite.from(zombie1Stand),
    };

    for (const bodySprite of Object.values(this.bodySprites)) {
      bodySprite.anchor.set(0.5, 0.5);
      bodySprite.scale.set((2 * ZOMBIE_RADIUS) / bodySprite.height);
      this.sprite.addChild(bodySprite);
    }
  }

  // TODO: Guarantee that this happens after everyone else's render calls. Why?
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
        case "ready":
          return this.bodySprites.walking; // TODO: Standing still
        case "windup":
        case "attack":
          return this.bodySprites.windup;
        case "winddown":
          return this.bodySprites.winddown;
      }
    }
  }
}

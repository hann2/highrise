import { Sprite } from "pixi.js";
import img_spitter from "../../../../resources/images/zombies/spitter.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { ZOMBIE_RADIUS } from "../../constants";
import { Layers } from "../../layers";
import Zombie from "./Zombie";

interface BodySprites {
  standing: Sprite;
  stunned: Sprite;
  walking: Sprite;
  windup: Sprite;
  winddown: Sprite;
}
export default class SpitterSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  bodySprites: BodySprites;

  constructor(public zombie: Zombie) {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layers.WORLD;
    this.sprite.anchor.set(0.5, 0.5);

    this.bodySprites = {
      standing: Sprite.from(img_spitter),
      stunned: Sprite.from(img_spitter),
      walking: Sprite.from(img_spitter),
      windup: Sprite.from(img_spitter),
      winddown: Sprite.from(img_spitter),
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

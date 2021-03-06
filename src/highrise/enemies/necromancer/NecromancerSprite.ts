import { Sprite } from "pixi.js";
import img_necromancer from "../../../../resources/images/zombies/necromancer.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { Layer } from "../../config/layers";
import Necromancer, { NECROMANCER_RADIUS } from "./Necromancer";

interface BodySprites {
  standing: Sprite;
  stunned: Sprite;
  walking: Sprite;
  windup: Sprite;
  winddown: Sprite;
}
export default class NecromancerSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  bodySprites: BodySprites;

  constructor(public necromancer: Necromancer) {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layer.WORLD;
    this.sprite.anchor.set(0.5, 0.5);

    this.bodySprites = {
      standing: Sprite.from(img_necromancer),
      stunned: Sprite.from(img_necromancer),
      walking: Sprite.from(img_necromancer),
      windup: Sprite.from(img_necromancer),
      winddown: Sprite.from(img_necromancer),
    };

    for (const bodySprite of Object.values(this.bodySprites)) {
      bodySprite.anchor.set(0.5, 0.5);
      bodySprite.scale.set((2 * NECROMANCER_RADIUS) / bodySprite.height);
      this.sprite.addChild(bodySprite);
    }
  }

  onRender() {
    const { body } = this.necromancer;
    [this.sprite.x, this.sprite.y] = body.position;
    this.sprite.rotation = body.angle;

    const currentBodySprite = this.getCurrentBodySprite();

    for (const s of Object.values(this.bodySprites)) {
      s.visible = s === currentBodySprite;
    }
  }

  getCurrentBodySprite() {
    if (this.necromancer.isStunned) {
      return this.bodySprites.stunned;
    } else {
      switch (this.necromancer.getAttackPhase()) {
        case "cooldown":
        case "ready":
          return this.bodySprites.walking;
        case "windup":
        case "attack":
          return this.bodySprites.windup;
        case "winddown":
          return this.bodySprites.winddown;
      }
    }
  }
}

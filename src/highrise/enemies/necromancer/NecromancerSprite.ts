import { Container, Sprite } from "pixi.js";
import { Layer } from "../../../config/layers";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";
import Necromancer, { NECROMANCER_RADIUS } from "./Necromancer";

interface BodySprites {
  standing: Sprite;
  stunned: Sprite;
  walking: Sprite;
  windup: Sprite;
  winddown: Sprite;
}
export default class NecromancerSprite extends BaseEntity implements Entity {
  sprite: Container & GameSprite;

  bodySprites: BodySprites;

  constructor(public necromancer: Necromancer) {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.WORLD;

    this.bodySprites = {
      standing: Sprite.from("necromancer"),
      stunned: Sprite.from("necromancer"),
      walking: Sprite.from("necromancer"),
      windup: Sprite.from("necromancer"),
      winddown: Sprite.from("necromancer"),
    };

    for (const bodySprite of Object.values(this.bodySprites)) {
      bodySprite.anchor.set(0.5, 0.5);
      bodySprite.scale.set((2 * NECROMANCER_RADIUS) / bodySprite.height);
      this.sprite.addChild(bodySprite);
    }
  }

  onRender() {
    const { body } = this.necromancer;
    this.sprite.position.copyFrom(body.position);
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

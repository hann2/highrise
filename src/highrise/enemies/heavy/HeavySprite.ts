import { Sprite } from "pixi.js";
import img_heavy from "../../../../resources/images/zombies/heavy.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { Layer } from "../../config/layers";
import { ZOMBIE_RADIUS } from "../../constants";
import Heavy from "./Heavy";

interface BodySprites {
  standing: Sprite;
  stunned: Sprite;
  walking: Sprite;
  windup: Sprite;
  winddown: Sprite;
}
export default class HeavySprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  bodySprites: BodySprites;

  constructor(public heavy: Heavy) {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layer.WORLD;
    this.sprite.anchor.set(0.5, 0.5);

    this.bodySprites = {
      standing: Sprite.from(img_heavy),
      stunned: Sprite.from(img_heavy),
      walking: Sprite.from(img_heavy),
      windup: Sprite.from(img_heavy),
      winddown: Sprite.from(img_heavy),
    };

    for (const bodySprite of Object.values(this.bodySprites)) {
      bodySprite.anchor.set(0.5, 0.5);
      bodySprite.scale.set((2 * ZOMBIE_RADIUS) / bodySprite.height);
      this.sprite.addChild(bodySprite);
    }
  }

  onRender() {
    const { body } = this.heavy;
    [this.sprite.x, this.sprite.y] = body.position;
    this.sprite.rotation = body.angle;

    const currentBodySprite = this.getCurrentBodySprite();

    for (const s of Object.values(this.bodySprites)) {
      s.visible = s === currentBodySprite;
    }
  }

  getCurrentBodySprite() {
    if (this.heavy.isStunned) {
      return this.bodySprites.stunned;
    } else {
      switch (this.heavy.getAttackPhase()) {
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
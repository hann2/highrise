import { Sprite } from "pixi.js";
import img_spitter from "../../../../resources/images/zombies/spitter.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { Layer } from "../../config/layers";
import { ZOMBIE_RADIUS } from "../../constants/constants";
import { PointLight } from "../../lighting-and-vision/PointLight";
import Spitter from "./Spitter";

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
  glow: PointLight;

  constructor(public spitter: Spitter) {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layer.WORLD;
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

    this.glow = this.addChild(new PointLight({ color: 0x00ff00 }));
  }

  onRender() {
    const { body } = this.spitter;
    this.sprite.position.set(...body.position);
    this.sprite.rotation = body.angle;
    this.glow.setPosition(body.position);

    const currentBodySprite = this.getCurrentBodySprite();

    for (const s of Object.values(this.bodySprites)) {
      s.visible = s === currentBodySprite;
    }
  }

  getCurrentBodySprite() {
    if (this.spitter.isStunned) {
      return this.bodySprites.stunned;
    } else {
      switch (this.spitter.getAttackPhase()) {
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

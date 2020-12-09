import { Sprite } from "pixi.js";
import bloodsplats1 from "../../../resources/images/bloodsplats/bloodsplats_1.png";
import bloodsplats2 from "../../../resources/images/bloodsplats/bloodsplats_2.png";
import bloodsplats3 from "../../../resources/images/bloodsplats/bloodsplats_3.png";
import bloodsplats4 from "../../../resources/images/bloodsplats/bloodsplats_4.png";
import bloodsplats5 from "../../../resources/images/bloodsplats/bloodsplats_5.png";
import bloodsplats6 from "../../../resources/images/bloodsplats/bloodsplats_6.png";
import bloodsplats7 from "../../../resources/images/bloodsplats/bloodsplats_7.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { choose, rUniform } from "../../core/util/Random";
import { Layers } from "../layers";

export const BLOOD_SPLAT_URLS = [
  bloodsplats1,
  bloodsplats2,
  bloodsplats3,
  bloodsplats4,
  bloodsplats5,
  bloodsplats6,
  bloodsplats7,
];

export default class BloodSplat extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  constructor([x, y]: [number, number]) {
    super();

    this.sprite = Sprite.from(choose(...BLOOD_SPLAT_URLS));
    this.sprite.scale.set(1 / 64);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.layerName = Layers.WORLD_BACK;
    this.sprite.position.set(x, y);
    this.sprite.rotation = rUniform(0, Math.PI / 2);
  }
}
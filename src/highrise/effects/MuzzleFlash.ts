import { BLEND_MODES, Sprite } from "pixi.js";
import muzzleFlash1 from "../../../resources/images/muzzle_flashs/muzzle-flash-1.png";
import muzzleFlash10 from "../../../resources/images/muzzle_flashs/muzzle-flash-10.png";
import muzzleFlash11 from "../../../resources/images/muzzle_flashs/muzzle-flash-11.png";
import muzzleFlash12 from "../../../resources/images/muzzle_flashs/muzzle-flash-12.png";
import muzzleFlash13 from "../../../resources/images/muzzle_flashs/muzzle-flash-13.png";
import muzzleFlash14 from "../../../resources/images/muzzle_flashs/muzzle-flash-14.png";
import muzzleFlash15 from "../../../resources/images/muzzle_flashs/muzzle-flash-15.png";
import muzzleFlash16 from "../../../resources/images/muzzle_flashs/muzzle-flash-16.png";
import muzzleFlash2 from "../../../resources/images/muzzle_flashs/muzzle-flash-2.png";
import muzzleFlash3 from "../../../resources/images/muzzle_flashs/muzzle-flash-3.png";
import muzzleFlash4 from "../../../resources/images/muzzle_flashs/muzzle-flash-4.png";
import muzzleFlash5 from "../../../resources/images/muzzle_flashs/muzzle-flash-5.png";
import muzzleFlash6 from "../../../resources/images/muzzle_flashs/muzzle-flash-6.png";
import muzzleFlash7 from "../../../resources/images/muzzle_flashs/muzzle-flash-7.png";
import muzzleFlash8 from "../../../resources/images/muzzle_flashs/muzzle-flash-8.png";
import muzzleFlash9 from "../../../resources/images/muzzle_flashs/muzzle-flash-9.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layers } from "../layers";
import { PointLight } from "../lighting/PointLight";

export const MUZZLE_FLASH_URLS = [
  muzzleFlash1,
  muzzleFlash2,
  muzzleFlash3,
  muzzleFlash4,
  muzzleFlash5,
  muzzleFlash6,
  muzzleFlash7,
  muzzleFlash8,
  muzzleFlash9,
  muzzleFlash10,
  muzzleFlash11,
  muzzleFlash12,
  muzzleFlash13,
  muzzleFlash14,
  muzzleFlash15,
  muzzleFlash16,
];

const SCALE = 1 / 200; // scale of the image
const DURATION = 0.1; // seconds
const RADIUS = 12; // meters for light
export default class MuzzleFlash extends BaseEntity implements Entity {
  light?: PointLight;
  timeLeft: number = DURATION;
  sprite: Sprite & GameSprite;

  constructor(position: V2d, angle: number) {
    super();

    this.sprite = Sprite.from(choose(...MUZZLE_FLASH_URLS));
    this.sprite.anchor.set(0.3, 0.5);
    this.sprite.scale.set(1 / 150);
    this.sprite.position.set(...position);
    this.sprite.rotation = angle;
    this.sprite.blendMode = BLEND_MODES.ADD;
    this.sprite.layerName = Layers.WORLD_OVERLAY;
  }

  onAdd() {
    this.light = this.addChild(new PointLight(RADIUS, 0.8, 0xffeeaa, true));
    this.light.setPosition([this.sprite.position.x, this.sprite.position.y]);
  }

  onTick(dt: number) {
    const t = this.timeLeft / DURATION;
    this.light?.setIntensity(0.9 * t);

    this.sprite.alpha = t;
    this.sprite.scale.set(SCALE * (1.8 - t ** 2));

    this.timeLeft -= dt;
    if (this.timeLeft < 0) {
      this.destroy();
    }
  }
}

import { Sprite } from "pixi.js";
import { ImageName } from "../../../resources/resources";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { PointLight } from "../lighting-and-vision/PointLight";

const MUZZLE_FLASH_TEXTURES: ImageName[] = [
  "muzzleFlash1",
  "muzzleFlash2",
  "muzzleFlash3",
  "muzzleFlash4",
  "muzzleFlash5",
  "muzzleFlash6",
  "muzzleFlash7",
  "muzzleFlash8",
  "muzzleFlash9",
  "muzzleFlash10",
  "muzzleFlash11",
  "muzzleFlash12",
  "muzzleFlash13",
  "muzzleFlash14",
  "muzzleFlash15",
  "muzzleFlash16",
];

const SCALE = 1 / 220; // scale of the image
const DURATION = 0.1; // seconds
const RADIUS = 12; // meters for light

export default class MuzzleFlash extends BaseEntity implements Entity {
  light?: PointLight;
  timeLeft: number = DURATION;
  sprite: Sprite & GameSprite;

  constructor(position: V2d, angle: number) {
    super();

    this.sprite = Sprite.from(choose(...MUZZLE_FLASH_TEXTURES));
    this.sprite.anchor.set(0.1, 0.5);
    this.sprite.scale.set(SCALE);
    this.sprite.position.copyFrom(position);
    this.sprite.rotation = angle;
    this.sprite.blendMode = "add";
    this.sprite.layerName = Layer.EMISSIVES;
  }

  @on("add")
  onAdd() {
    this.light = this.addChild(
      new PointLight({
        radius: RADIUS,
        intensity: 0.8,
        color: 0xffeeaa,
        shadowsEnabled: true,
        softShadows: true,
        position: this.getPosition(),
      }),
    );
  }

  @on("tick")
  onTick(dt: number) {
    const t = this.timeLeft / DURATION;
    this.light?.setIntensity(0.9 * t);

    this.sprite.alpha = t;
    this.sprite.scale.set(SCALE * (2.0 - t ** 2));
    this.timeLeft -= dt;

    if (this.timeLeft < 0) {
      this.destroy();
    }
  }
}

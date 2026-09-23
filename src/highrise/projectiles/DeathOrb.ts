import { Sprite } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { polarToVec } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import { getBlobPair } from "../effects/Splat";
import Spitter from "../enemies/spitter/Spitter";
import Human from "../human/Human";
import { inflictDamageFrom } from "../run/damageSources";
import { HitResult, Projectile } from "./Projectile";

export const DEATH_ORB_RADIUS = 0.4; // meters

export default class DeathOrb extends Projectile implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    position: V2d,
    direction: number,
    speed: number = 15,
    public damage: number = 40,
    public readonly shooter?: Spitter,
    public mass: number = 0.25,
  ) {
    super(position, polarToVec(direction, speed));

    const [texture, glowTexture] = getBlobPair();

    this.sprite = Sprite.from(texture);
    const scale = (2 * DEATH_ORB_RADIUS) / this.sprite.texture.width;
    this.sprite.scale.set(scale);
    this.sprite.tint = 0xff0000;
    this.sprite.layerName = Layer.WEAPONS;
    const glow = Sprite.from(glowTexture);
    glow.tint = 0xff3333;
    glow.blendMode = "add";
    glow.alpha = 0.3;
    this.sprite.addChild(glow);
  }

  makeCollisionMask() {
    return CollisionGroups.All ^ CollisionGroups.Enemies;
  }

  handleHit({ hit }: HitResult) {
    if (hit instanceof Human) {
      inflictDamageFrom(hit, this.damage, this.shooter ?? "Necromancer");
    }
    return true;
  }

  @on("render")
  onRender(dt: number) {
    this.sprite.position.copyFrom(this.renderPosition);
    this.sprite.rotation += dt * 1.5;
  }
}

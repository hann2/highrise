import { Graphics } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { clamp } from "../../core/util/MathUtil";
import { rNormal } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { BaseEnemy, isEnemy } from "../enemies/base/Enemy";
import { getFireGrid } from "../fire/FireGrid";
import type Human from "../human/Human";
import { PointLight } from "../lighting-and-vision/PointLight";
import { ConsumableStats } from "../weapons/consumables/ConsumableStats";

/** Seconds for the blast ring to spread out and fade */
const RING_DURATION = 0.3;

/**
 * A grenade (or any `ConsumableStats`) going off: hurts, shoves and stuns
 * enemies that have a clear line to it, with a flash of light, a bang and a
 * ring on the floor.
 */
export default class Detonation extends BaseEntity implements Entity {
  sprite?: Graphics & GameSprite;
  private light?: PointLight;

  constructor(
    public stats: ConsumableStats,
    private position: V2d,
    private attacker?: Human,
  ) {
    super();

    const { blastRing } = stats;
    if (blastRing) {
      this.sprite = new Graphics();
      this.sprite
        .circle(0, 0, blastRing.radius)
        .stroke({ width: 0.25, color: blastRing.color, alpha: 0.9 })
        .circle(0, 0, blastRing.radius * 0.6)
        .fill({ color: blastRing.color, alpha: 0.35 });
      this.sprite.blendMode = "add";
      this.sprite.layerName = Layer.EMISSIVES;
      this.sprite.position.copyFrom(position);
      this.sprite.scale.set(0.1);
    }
  }

  getPosition() {
    return this.position;
  }

  @on("add")
  async onAdd() {
    for (const sound of this.stats.sounds.detonate) {
      this.game.addEntity(
        new PositionalSound(sound.name, this.position, {
          gain: sound.gain,
          speed: sound.speed * rNormal(1, 0.03),
          maxDistance: 30,
        }),
      );
    }

    this.hitEnemies();

    const { fire } = this.stats;
    const grid = getFireGrid(this.game);
    if (fire && grid) {
      const cells = grid.spillFuel(this.position, fire.radius, fire.fuel);
      grid.igniteCells(cells, this.attacker);
    }

    const { flash } = this.stats;
    this.light = this.addChild(
      new PointLight({
        radius: flash.radius,
        intensity: flash.intensity,
        color: flash.color,
        softShadows: true,
        position: this.position,
      }),
    );

    const duration = Math.max(flash.duration, RING_DURATION);
    await this.wait(duration, (_, t) => {
      const seconds = t * duration;
      const flashLeft = clamp(1 - seconds / flash.duration);
      this.light?.setIntensity(flash.intensity * flashLeft ** 2);
      if (this.sprite) {
        const ringT = clamp(seconds / RING_DURATION);
        this.sprite.scale.set(0.1 + 0.9 * Math.sqrt(ringT));
        this.sprite.alpha = 1 - ringT;
      }
    });
    this.destroy();
  }

  /** Whether nothing solid is between the blast and `enemy` */
  private canReach(enemy: BaseEnemy): boolean {
    const hit = this.game.world.raycast(this.position, enemy.getPosition(), {
      skipBackfaces: true,
      collisionMask: CollisionGroups.CastsShadow,
    });
    return hit == null || hit.body === enemy.body;
  }

  private hitEnemies() {
    const { damage, damageRadius, knockback, stunRadius, stunDuration } =
      this.stats;
    const reach = Math.max(damageRadius, stunRadius);
    // Copied, because enemies die (and zombies turn into crawlers) as we go
    const enemies = [...this.game.entities.getByFilter(isEnemy)];
    for (const enemy of enemies) {
      const offset = enemy.getPosition().sub(this.position);
      const distance = offset.magnitude;
      if (distance > reach || !this.canReach(enemy)) {
        continue;
      }
      const falloff = damageRadius > 0 ? clamp(1 - distance / damageRadius) : 0;
      if (knockback > 0 && falloff > 0 && distance > 0) {
        enemy.knockback(offset.inormalize().imul(knockback * falloff));
      }
      if (distance <= stunRadius && stunDuration > 0) {
        enemy.stun(stunDuration);
      }
      if (damage > 0 && falloff > 0) {
        enemy.takeHit(damage * falloff, this.attacker);
      }
    }
  }
}

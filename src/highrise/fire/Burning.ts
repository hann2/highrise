import { Container, Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { clamp } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import type Human from "../human/Human";
import { PointLight } from "../lighting-and-vision/PointLight";
import { BURN_FADE_TIME, flicker } from "./fireConstants";

/** Something that can catch fire: enemies and humans */
export interface Flammable extends BaseEntity {
  /** Set while it's on fire. Only `ignite` and `Burning` set it. */
  burning?: Burning;
  getPosition(): V2d;
  /** Seconds it keeps burning after it was last lit */
  readonly burnTime: number;
  /** Damage per second while burning */
  readonly burnDps: number;
  /** Seconds between chunks of burn damage */
  readonly burnDamageInterval: number;
  /** Hurts it without the blood and flinching of a hit */
  takeBurnDamage(amount: number, source?: Human): void;
  /** Called when it catches fire (not when it's lit again while burning) */
  handleIgnite?(): void;
}

/**
 * Sets `target` on fire, or keeps it burning for at least `duration` more
 * seconds if it already is. `source` gets the credit for a kill.
 */
export function ignite(
  target: Flammable,
  source?: Human,
  duration: number = target.burnTime,
): Burning {
  if (target.burning) {
    target.burning.relight(duration, source);
    return target.burning;
  }
  const burning = target.addChild(new Burning(target, duration, source));
  target.burning = burning;
  if (target.isAdded) {
    target.handleIgnite?.();
  }
  return burning;
}

/** How many flame blobs the placeholder look has */
const FLAME_COUNT = 4;

/**
 * The fire on something that's burning, as its child: hurts it over time and
 * goes out on its own. The look is a placeholder: flickering blobs and a
 * light.
 */
export default class Burning extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  private flames: Graphics[] = [];
  private light?: PointLight;
  /** Damage owed but not dealt yet, dealt every `burnDamageInterval` */
  private pendingDamage = 0;
  private damageTimer = 0;

  constructor(
    public target: Flammable,
    public timeLeft: number,
    public source?: Human,
  ) {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.EMISSIVES;
    for (let i = 0; i < FLAME_COUNT; i++) {
      const flame = new Graphics()
        .circle(0, 0, 0.3)
        .fill({ color: 0xff5500, alpha: 0.5 })
        .circle(0, 0, 0.18)
        .fill({ color: 0xffaa33, alpha: 0.6 })
        .circle(0, 0, 0.08)
        .fill({ color: 0xffeeaa, alpha: 0.7 });
      flame.blendMode = "add";
      this.flames.push(flame);
      this.sprite.addChild(flame);
    }
  }

  @on("add")
  onAdd() {
    this.light = this.addChild(
      new PointLight({
        radius: 4,
        intensity: 0.6,
        color: 0xff8833,
        position: this.target.getPosition(),
      }),
    );
  }

  /** Keeps it burning for at least `duration` more seconds */
  relight(duration: number, source?: Human) {
    this.timeLeft = Math.max(this.timeLeft, duration);
    if (source) {
      this.source = source;
    }
  }

  @on("tick")
  onTick(dt: number) {
    this.timeLeft -= dt;
    this.pendingDamage += this.target.burnDps * dt;
    this.damageTimer += dt;
    if (this.damageTimer >= this.target.burnDamageInterval) {
      this.damageTimer = 0;
      const damage = this.pendingDamage;
      this.pendingDamage = 0;
      // Can destroy the target, and this with it
      this.target.takeBurnDamage(damage, this.source);
    }
    if (this.timeLeft <= 0 && !this.isDestroyed) {
      this.destroy();
    }
  }

  @on("render")
  onRender() {
    const position = this.target.getPosition();
    this.sprite.position.copyFrom(position);
    // Shrinks away over the last moments
    const size = clamp(this.timeLeft / BURN_FADE_TIME);
    const t = this.game.elapsedUnpausedTime;
    this.flames.forEach((flame, i) => {
      flame.position.set(
        0.15 * flicker(t, i * 3.1),
        0.15 * flicker(t, i * 3.1 + 1.3),
      );
      flame.scale.set(size * (1 + 0.2 * flicker(t, i * 3.1 + 2.2)));
    });
    this.light?.setPosition(position);
    this.light?.setIntensity(0.6 * size * (1 + 0.15 * flicker(t, 0.7)));
  }

  @on("destroy")
  onDestroy() {
    if (this.target.burning === this) {
      this.target.burning = undefined;
    }
  }
}

import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { clamp } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import type Human from "../human/Human";
import { PointLight } from "../lighting-and-vision/PointLight";
import {
  BURN_FADE_TIME,
  BURNING_LIGHT_INTENSITY,
  BURNING_LIGHT_RADIUS,
  fireLightFlicker,
} from "./fireConstants";
import { getFireGrid } from "./FireGrid";

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

/** Different for each fire, so they don't flicker in step */
let nextPhase = 0;

/**
 * The fire on something that's burning, as its child: hurts it over time and
 * goes out on its own, with a flickering light. `FireRenderer` draws the
 * flames.
 */
export default class Burning extends BaseEntity implements Entity {
  private light?: PointLight;
  /** Damage owed but not dealt yet, dealt every `burnDamageInterval` */
  private pendingDamage = 0;
  private damageTimer = 0;
  private phase = (nextPhase += 1.7);

  constructor(
    public target: Flammable,
    public timeLeft: number,
    public source?: Human,
  ) {
    super();
  }

  @on("add")
  onAdd() {
    this.light = this.addChild(
      new PointLight({
        radius: BURNING_LIGHT_RADIUS,
        intensity: 0,
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
    if (this.isDestroyed) {
      return;
    }
    // Lights the fuel it's standing in
    getFireGrid(this.game)?.igniteAt(this.target.getPosition(), this.source);
    if (this.timeLeft <= 0) {
      this.destroy();
    }
  }

  @on("render")
  onRender() {
    const position = this.target.getPosition();
    // Dims over the last moments
    const size = clamp(this.timeLeft / BURN_FADE_TIME);
    const t = this.game.elapsedUnpausedTime;
    const light = fireLightFlicker(t, this.phase);
    this.light?.setPosition(position.add(light.offset));
    this.light?.setIntensity(BURNING_LIGHT_INTENSITY * size * light.intensity);
    this.light?.setColor(light.color);
  }

  @on("destroy")
  onDestroy() {
    if (this.target.burning === this) {
      this.target.burning = undefined;
    }
  }
}

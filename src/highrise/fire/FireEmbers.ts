import { Container, Sprite, Texture } from "pixi.js";
import { gpuTimed } from "../../core/util/GpuProfiler";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { colorLerp } from "../../core/util/ColorUtils";
import { clamp } from "../../core/util/MathUtil";
import Burning from "./Burning";
import {
  EMBER_COLORS,
  EMBER_SPEED,
  EMBERS_PER_BURNING,
  EMBERS_PER_CELL,
  EMBERS_WHEN_LIT,
  MAX_EMBERS,
} from "./fireConstants";
import type FireGrid from "./FireGrid";
import { getSetting } from "../settings/SettingsController";

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  spin: number;
  sprite: Sprite;
}

/**
 * Embers: sparks that drift out of fire, grow a little as they rise towards
 * the camera, and fade from yellow to red, coming off burning cells and
 * burning things, with a burst from cells as they catch. Only looks: it has
 * its own random numbers, so it never disturbs the seeded ones. (Smoke is
 * `SmokeField`.)
 */
export default class FireEmbers extends BaseEntity implements Entity {
  tickLayer = "fire" as const;
  /** The embers' sprites */
  private emberContainer = new Container();
  sprite: Container & GameSprite = gpuTimed("FireEmbers", this.emberContainer);
  private embers: Ember[] = [];
  private spares: Sprite[] = [];
  /** Cells that were burning last frame, to see which just caught */
  private wasBurning = new Set<number>();
  /** A fraction of an ember owed from the spawn rate, carried between frames */
  private emberDebt = 0;
  private random = makeRandom(1234);

  constructor(
    private grid: FireGrid,
    private texture: Texture,
  ) {
    super();
    this.sprite.layerName = Layer.EMISSIVES;
  }

  @on("render")
  onRender(dt: number) {
    if (this.game.paused) {
      return;
    }
    this.amount = getSetting(this.game, "embers");
    this.spawn(dt);
    this.update(dt);
  }

  /** The fraction of embers made (the Embers setting) */
  private amount = 1;

  private spawn(dt: number) {
    const grid = this.grid;
    const random = this.random;

    // A burst from each cell as it catches
    for (const cell of grid.burning) {
      if (!this.wasBurning.has(cell)) {
        const [x, y] = grid.cellCenter(cell);
        for (let i = 0; i < EMBERS_WHEN_LIT; i++) {
          this.addEmber(x, y, 1.6);
        }
      }
    }
    this.wasBurning = new Set(grid.burning);

    // A steady trickle from everything burning, more from what's hotter
    const cells = [...grid.burning];
    const burning = this.game.entities.getByConstructor(Burning);
    const total = cells.length + burning.length;
    this.emberDebt +=
      (cells.length * EMBERS_PER_CELL + burning.length * EMBERS_PER_BURNING) *
      dt;
    for (; this.emberDebt >= 1; this.emberDebt -= 1) {
      const index = Math.floor(random() * total);
      if (index < cells.length) {
        const cell = cells[index];
        if (random() < grid.cellHeat(cell)) {
          const [x, y] = grid.cellCenter(cell);
          this.addEmber(x, y, 1);
        }
      } else if (index < total) {
        const [x, y] = burning[index - cells.length].target.getPosition();
        this.addEmber(x, y, 1);
      }
    }
  }

  private addEmber(x: number, y: number, speed: number) {
    const random = this.random;
    if (
      this.embers.length >= MAX_EMBERS * this.amount ||
      (this.amount < 1 && random() >= this.amount)
    ) {
      return;
    }
    const angle = random() * Math.PI * 2;
    const v = EMBER_SPEED * speed * (0.3 + random());
    const sprite = this.spares.pop() ?? new Sprite(this.texture);
    sprite.anchor.set(0.5);
    sprite.blendMode = "add";
    sprite.visible = true;
    this.emberContainer.addChild(sprite);
    this.embers.push({
      x: x + (random() - 0.5) * 0.4,
      y: y + (random() - 0.5) * 0.4,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      age: 0,
      life: 0.5 + random() * 1.1,
      size: 0.07 + random() * 0.07,
      spin: random() * 10,
      sprite,
    });
  }

  /** Moves, slows, wobbles and ages embers, and puts away the ones gone out */
  private update(dt: number) {
    let kept = 0;
    for (const ember of this.embers) {
      ember.age += dt;
      if (ember.age >= ember.life) {
        ember.sprite.removeFromParent();
        this.spares.push(ember.sprite);
        continue;
      }
      ember.vx *= 1 - 1.5 * dt;
      ember.vy *= 1 - 1.5 * dt;
      // A wobble, so they don't fly dead straight
      ember.vx += Math.sin(ember.age * 9 + ember.spin) * 2.5 * dt;
      ember.vy += Math.cos(ember.age * 7 + ember.spin * 1.3) * 2.5 * dt;
      ember.x += ember.vx * dt;
      ember.y += ember.vy * dt;

      const t = clamp(ember.age / ember.life);
      const sprite = ember.sprite;
      sprite.position.set(ember.x, ember.y);
      sprite.tint = colorLerp(EMBER_COLORS[0], EMBER_COLORS[1], t);
      sprite.alpha = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9;
      // The texture is 64 pixels across
      sprite.scale.set((ember.size * (1 + 0.8 * t)) / 64);
      this.embers[kept++] = ember;
    }
    this.embers.length = kept;
  }

  @on("destroy")
  onDestroy() {
    // The texture is the FireRenderer's
    for (const sprite of this.spares) {
      sprite.destroy();
    }
  }
}

/** Mulberry32: small, fast, and separate from the game's seeded random */
function makeRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

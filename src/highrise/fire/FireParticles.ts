import { Container, Sprite, Texture } from "pixi.js";
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
  MAX_PUFFS,
  PUFF_ALPHA,
  PUFF_COLOR,
  PUFF_DRAUGHT,
  PUFF_GROWTH,
  PUFF_LIFE,
  PUFF_SIZE,
  PUFF_WHEN_LIT,
  SMOKE_PUFFS,
  PUFFS_PER_BURNING,
  PUFFS_PER_CELL,
} from "./fireConstants";
import type FireGrid from "./FireGrid";

interface Particle {
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
 * Embers (sparks that drift out of fire, grow a little as they rise towards
 * the camera, and fade from yellow to red) and smoke (dark puffs above the
 * world that grow and drift, lit by the fire under them) coming off burning
 * cells and burning things, with a burst from cells as they catch. Only
 * looks: it has its own random numbers, so it never disturbs the seeded ones.
 */
export default class FireParticles extends BaseEntity implements Entity {
  sprites: (Container & GameSprite)[];
  private emberContainer: Container & GameSprite = new Container();
  private smokeContainer: Container & GameSprite = new Container();
  private embers: Particle[] = [];
  private smoke: Particle[] = [];
  private spareEmbers: Sprite[] = [];
  private spareSmoke: Sprite[] = [];
  /** Cells that were burning last frame, to see which just caught */
  private wasBurning = new Set<number>();
  /** Fractions of a particle owed from spawn rates, carried between frames */
  private emberDebt = 0;
  private smokeDebt = 0;
  private random = makeRandom(1234);

  constructor(
    private grid: FireGrid,
    private emberTexture: Texture,
    private smokeTexture: Texture,
  ) {
    super();
    this.emberContainer.layerName = Layer.EMISSIVES;
    this.smokeContainer.layerName = Layer.WORLD_FRONT;
    this.sprites = [this.emberContainer, this.smokeContainer];
  }

  @on("render")
  onRender(dt: number) {
    if (this.game.paused) {
      return;
    }
    this.spawn(dt);
    this.update(this.embers, this.spareEmbers, dt, (p, t) => {
      p.vx *= 1 - 1.5 * dt;
      p.vy *= 1 - 1.5 * dt;
      // A wobble, so they don't fly dead straight
      p.vx += Math.sin(p.age * 9 + p.spin) * 2.5 * dt;
      p.vy += Math.cos(p.age * 7 + p.spin * 1.3) * 2.5 * dt;
      const sprite = p.sprite;
      sprite.tint = colorLerp(EMBER_COLORS[0], EMBER_COLORS[1], t);
      sprite.alpha = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9;
      sprite.scale.set((p.size * (1 + 0.8 * t)) / 64);
    });
    this.update(this.smoke, this.spareSmoke, dt, (p, t) => {
      p.vx += PUFF_DRAUGHT[0] * dt;
      p.vy += PUFF_DRAUGHT[1] * dt;
      p.vx *= 1 - 0.6 * dt;
      p.vy *= 1 - 0.6 * dt;
      const sprite = p.sprite;
      sprite.alpha = PUFF_ALPHA * Math.sin(Math.PI * Math.sqrt(t));
      sprite.scale.set((p.size * (1 + (PUFF_GROWTH - 1) * t)) / 128);
      sprite.rotation = p.spin + p.age * 0.3;
    });
  }

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
        if (SMOKE_PUFFS && random() < PUFF_WHEN_LIT) {
          this.addSmoke(x, y, 1);
        }
      }
    }
    this.wasBurning = new Set(grid.burning);

    // A steady trickle from everything burning
    const cells = [...grid.burning];
    const burning = this.game.entities.getByConstructor(Burning);
    this.emberDebt +=
      (cells.length * EMBERS_PER_CELL + burning.length * EMBERS_PER_BURNING) *
      dt;
    this.smokeDebt +=
      (cells.length * PUFFS_PER_CELL + burning.length * PUFFS_PER_BURNING) * dt;
    const pickSource = (): [number, number, number] | undefined => {
      const total = cells.length + burning.length;
      if (total === 0) {
        return undefined;
      }
      const index = Math.floor(random() * total);
      if (index < cells.length) {
        const cell = cells[index];
        const [x, y] = grid.cellCenter(cell);
        return [x, y, grid.cellHeat(cell)];
      }
      const [x, y] = burning[index - cells.length].target.getPosition();
      return [x, y, 1];
    };
    for (; this.emberDebt >= 1; this.emberDebt -= 1) {
      const source = pickSource();
      if (source && random() < source[2]) {
        this.addEmber(source[0], source[1], 1);
      }
    }
    if (!SMOKE_PUFFS) {
      this.smokeDebt = 0;
    }
    for (; this.smokeDebt >= 1; this.smokeDebt -= 1) {
      const source = pickSource();
      if (source && random() < source[2]) {
        this.addSmoke(source[0], source[1], 1);
      }
    }
  }

  private addEmber(x: number, y: number, speed: number) {
    if (this.embers.length >= MAX_EMBERS) {
      return;
    }
    const random = this.random;
    const angle = random() * Math.PI * 2;
    const v = EMBER_SPEED * speed * (0.3 + random());
    this.embers.push({
      x: x + (random() - 0.5) * 0.4,
      y: y + (random() - 0.5) * 0.4,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      age: 0,
      life: 0.5 + random() * 1.1,
      size: 0.07 + random() * 0.07,
      spin: random() * 10,
      sprite: this.takeSprite(this.spareEmbers, this.emberTexture, "add"),
    });
    this.emberContainer.addChild(this.embers[this.embers.length - 1].sprite);
  }

  private addSmoke(x: number, y: number, size: number) {
    if (this.smoke.length >= MAX_PUFFS) {
      return;
    }
    const random = this.random;
    const angle = random() * Math.PI * 2;
    const v = 0.2 + random() * 0.3;
    const sprite = this.takeSprite(
      this.spareSmoke,
      this.smokeTexture,
      "normal",
    );
    sprite.tint = PUFF_COLOR;
    this.smoke.push({
      x: x + (random() - 0.5) * 0.5,
      y: y + (random() - 0.5) * 0.5,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      age: 0,
      life: PUFF_LIFE[0] + random() * (PUFF_LIFE[1] - PUFF_LIFE[0]),
      size: (PUFF_SIZE[0] + random() * (PUFF_SIZE[1] - PUFF_SIZE[0])) * size,
      spin: random() * Math.PI * 2,
      sprite,
    });
    this.smokeContainer.addChild(sprite);
  }

  private takeSprite(
    spares: Sprite[],
    texture: Texture,
    blendMode: "add" | "normal",
  ): Sprite {
    const sprite = spares.pop() ?? new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.blendMode = blendMode;
    sprite.visible = true;
    return sprite;
  }

  /** Moves and ages particles, and puts away the ones whose time is up */
  private update(
    particles: Particle[],
    spares: Sprite[],
    dt: number,
    style: (particle: Particle, t: number) => void,
  ) {
    let kept = 0;
    for (const p of particles) {
      p.age += dt;
      if (p.age >= p.life) {
        p.sprite.visible = false;
        p.sprite.removeFromParent();
        spares.push(p.sprite);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.sprite.position.set(p.x, p.y);
      style(p, clamp(p.age / p.life));
      particles[kept++] = p;
    }
    particles.length = kept;
  }

  /** Takes every particle away at once */
  clear() {
    for (const p of this.embers) {
      p.sprite.removeFromParent();
      this.spareEmbers.push(p.sprite);
    }
    for (const p of this.smoke) {
      p.sprite.removeFromParent();
      this.spareSmoke.push(p.sprite);
    }
    this.embers = [];
    this.smoke = [];
    this.wasBurning.clear();
  }

  @on("destroy")
  onDestroy() {
    for (const sprite of [...this.spareEmbers, ...this.spareSmoke]) {
      sprite.destroy();
    }
    // The ember texture is the FireRenderer's; the smoke one is ours
    this.smokeTexture.destroy(true);
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

/**
 * A puff of smoke: a soft disc with billows in it (a few octaves of value
 * noise), so overlapping puffs keep some shape instead of making a flat fog.
 * Made without the seeded random numbers.
 */
export function makeSmokeTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;
  const image = context.createImageData(size, size);
  const hash = (x: number, y: number) => {
    const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
  };
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx;
    const bottom =
      hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * sx;
    return top + (bottom - top) * sy;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size - 0.5;
      const v = (y + 0.5) / size - 0.5;
      let billows = 0;
      let amplitude = 0.5;
      for (let octave = 0; octave < 4; octave++) {
        const scale = 4 * 2 ** octave;
        billows += amplitude * noise(u * scale + 10, v * scale + 10);
        amplitude /= 2;
      }
      const r = Math.hypot(u, v) * 2;
      // Lumpy at the edge, and thinner and thicker inside
      const edge = clamp((1 - r) * 2.2 + (billows - 0.47) * 1.6);
      const value = edge * edge * (0.45 + 0.9 * billows);
      const i = (y * size + x) * 4;
      image.data[i] = 255;
      image.data[i + 1] = 255;
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(clamp(value) * 255);
    }
  }
  context.putImageData(image, 0, 0);
  return Texture.from(canvas);
}

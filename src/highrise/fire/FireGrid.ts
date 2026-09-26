import { Container, Graphics } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import type Game from "../../core/Game";
import { clamp } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import { isEnemy } from "../enemies/base/Enemy";
import type Human from "../human/Human";
import { isHuman } from "../human/Human";
import type { Level } from "../levels/Level";
import { PointLight } from "../lighting-and-vision/PointLight";
import { ignite } from "./Burning";
import {
  FIRE_CELL_SIZE,
  CELL_LIGHT_INTENSITY,
  CELL_LIGHT_RADIUS,
  FIRE_LIGHT_EXTRA_RADIUS,
  FIRE_LIGHT_FULL_PATCH,
  FIRE_LIGHT_MIN_RADIUS,
  FIRE_LIGHT_PATCH_RADIUS,
  fireLightFlicker,
  FIRE_SPREAD_DELAY,
  flicker,
} from "./fireConstants";

/** The four neighbors of a cell, as [dx, dy] */
const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/**
 * Fire on the floor: a grid over the level where each cell can hold fuel
 * (seconds of burning) and be on fire. A burning cell uses up its fuel, and
 * after `FIRE_SPREAD_DELAY` lights its neighbors that have fuel, unless a wall
 * is in the way. Cells without fuel never burn, so fire only goes where fuel
 * was spilled. Anything standing in a burning cell catches fire; anything
 * burning lights the fuel it walks over (see `Burning`).
 *
 * The look is a placeholder: fuel is a dark stain, fire is flickering orange
 * squares, burnt-out cells are scorched, and each burning patch has a light.
 */
export default class FireGrid extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  sprites: (Container & GameSprite)[];

  /** Cells across and down */
  columns = 0;
  rows = 0;
  /** Seconds of burning left in each cell */
  private fuel = new Float32Array(0);
  /** Seconds each burning cell has been burning, or -1 when it isn't */
  private burnAge = new Float32Array(0);
  /** Cells that have burnt out, for the scorch marks */
  private scorched = new Uint8Array(0);
  /** Who lit each burning cell, so kills are credited to them */
  private sources = new Map<number, Human | undefined>();
  /** Indexes of the cells that are burning */
  private burningCells = new Set<number>();
  /**
   * How fire on the floor is lit: one light per patch of fire, or (to see
   * what it costs) one per burning cell. An experiment; one will go.
   */
  lightMode: "patches" | "cells" | "none" = "patches";
  /** One light per patch of fire (see `updateLights`) */
  private lights: FireLight[] = [];
  private nextLightPhase = 0;
  /** One light per burning cell, in the "cells" light mode */
  private cellLights = new Map<number, PointLight>();

  /** Fuel stains and scorch marks, redrawn only when they change */
  private floorGraphics = new Graphics();
  private floorDirty = false;
  /** The flames, redrawn every frame */
  private fireGraphics = new Graphics();

  constructor() {
    super();
    const floor: Container & GameSprite = new Container();
    floor.layerName = Layer.FLOOR_DECALS;
    floor.addChild(this.floorGraphics);
    const fire: Container & GameSprite = new Container();
    fire.layerName = Layer.EMISSIVES;
    this.fireGraphics.blendMode = "add";
    fire.addChild(this.fireGraphics);
    this.sprites = [floor, fire];
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    game.entities.addFilter(isEnemy);
    game.entities.addFilter(isHuman);
  }

  @on("startLevel")
  onStartLevel({ level }: { level: Level }) {
    this.reset(level.width, level.height);
  }

  /** Empties the grid and sizes it to a level of `width` × `height` meters */
  reset(width: number, height: number) {
    this.columns = Math.ceil(width / FIRE_CELL_SIZE);
    this.rows = Math.ceil(height / FIRE_CELL_SIZE);
    const count = this.columns * this.rows;
    this.fuel = new Float32Array(count);
    this.burnAge = new Float32Array(count);
    this.scorched = new Uint8Array(count);
    this.clear();
  }

  /** Puts out all the fire, and takes away the fuel and scorch marks */
  clear() {
    this.fuel.fill(0);
    this.burnAge.fill(-1);
    this.scorched.fill(0);
    this.sources.clear();
    this.burningCells.clear();
    this.removeLights();
    this.floorDirty = true;
  }

  private removeLights() {
    for (const { light } of this.lights) {
      if (!light.isDestroyed) {
        light.destroy();
      }
    }
    this.lights = [];
    for (const light of this.cellLights.values()) {
      if (!light.isDestroyed) {
        light.destroy();
      }
    }
    this.cellLights.clear();
  }

  /** Switches between the light modes (see `lightMode`) */
  setLightMode(mode: "patches" | "cells" | "none") {
    if (mode !== this.lightMode) {
      this.removeLights();
      this.lightMode = mode;
    }
  }

  /** The index of the cell at `position`, or -1 outside the grid */
  cellAt([x, y]: [number, number]): number {
    const column = Math.floor(x / FIRE_CELL_SIZE);
    const row = Math.floor(y / FIRE_CELL_SIZE);
    if (column < 0 || row < 0 || column >= this.columns || row >= this.rows) {
      return -1;
    }
    return row * this.columns + column;
  }

  /** The middle of cell `cell`, in meters */
  cellCenter(cell: number): V2d {
    const column = cell % this.columns;
    const row = Math.floor(cell / this.columns);
    return V((column + 0.5) * FIRE_CELL_SIZE, (row + 0.5) * FIRE_CELL_SIZE);
  }

  isBurningAt(position: [number, number]): boolean {
    const cell = this.cellAt(position);
    return cell >= 0 && this.burnAge[cell] >= 0;
  }

  fuelAt(position: [number, number]): number {
    const cell = this.cellAt(position);
    return cell >= 0 ? this.fuel[cell] : 0;
  }

  /** How many cells are burning */
  get burningCount(): number {
    return this.burningCells.size;
  }

  /**
   * Spills `amount` seconds of fuel into the cells within `radius` meters of
   * `center` that fuel can flow to from there without crossing a wall. Less
   * towards the edge, and the edge is ragged. Returns the cells it spilled
   * into.
   */
  spillFuel(center: V2d, radius: number, amount: number): number[] {
    const start = this.cellAt(center);
    if (start < 0) {
      return [];
    }
    const spilled: number[] = [];
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length > 0) {
      const cell = queue.shift()!;
      const distance = this.cellCenter(cell).distanceTo(center);
      const reach = radius * rUniform(0.75, 1.1);
      if (cell !== start && distance > reach) {
        continue;
      }
      this.fuel[cell] += amount * (1 - 0.5 * clamp(distance / radius));
      spilled.push(cell);
      for (const neighbor of this.neighbors(cell)) {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          if (!this.isWallBetween(cell, neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }
    this.floorDirty = true;
    return spilled;
  }

  /**
   * Adds `amount` seconds of fuel to the cells along the line from `from` to
   * `to` (a trail, like a leaking can), up to the first wall.
   */
  addFuelAlong(from: V2d, to: V2d, amount: number) {
    const hit = this.game.world.raycast(from, to, {
      collisionMask: CollisionGroups.Walls,
      skipBackfaces: true,
    });
    if (hit) {
      to = V(hit.point);
    }
    const steps = Math.ceil(from.distanceTo(to) / (FIRE_CELL_SIZE / 2)) + 1;
    const cells = new Set<number>();
    for (let i = 0; i < steps; i++) {
      const t = steps > 1 ? i / (steps - 1) : 0;
      const cell = this.cellAt(from.lerp(to, t));
      if (cell >= 0) {
        cells.add(cell);
      }
    }
    for (const cell of cells) {
      this.fuel[cell] += amount;
    }
    this.floorDirty = true;
  }

  /** Sets fire to the cell at `position` if it has fuel. Returns whether it's burning. */
  igniteAt(position: [number, number], source?: Human): boolean {
    return this.igniteCell(this.cellAt(position), source);
  }

  /** Sets fire to every cell with fuel in `cells` */
  igniteCells(cells: readonly number[], source?: Human) {
    for (const cell of cells) {
      this.igniteCell(cell, source);
    }
  }

  private igniteCell(cell: number, source?: Human): boolean {
    if (cell < 0 || this.fuel[cell] <= 0) {
      return false;
    }
    if (this.burnAge[cell] < 0) {
      this.burnAge[cell] = 0;
      this.burningCells.add(cell);
      this.sources.set(cell, source);
    }
    return true;
  }

  @on("tick")
  onTick(dt: number) {
    if (this.burningCells.size === 0) {
      return;
    }

    // Copied, because cells light and go out as we go
    for (const cell of [...this.burningCells]) {
      const age = this.burnAge[cell];
      this.burnAge[cell] = age + dt;
      this.fuel[cell] -= dt;
      if (age < FIRE_SPREAD_DELAY && age + dt >= FIRE_SPREAD_DELAY) {
        const source = this.sources.get(cell);
        for (const neighbor of this.neighbors(cell)) {
          if (
            this.fuel[neighbor] > 0 &&
            this.burnAge[neighbor] < 0 &&
            !this.isWallBetween(cell, neighbor)
          ) {
            this.igniteCell(neighbor, source);
          }
        }
      }
      if (this.fuel[cell] <= 0) {
        this.fuel[cell] = 0;
        this.burnAge[cell] = -1;
        this.burningCells.delete(cell);
        this.sources.delete(cell);
        this.scorched[cell] = 1;
        this.floorDirty = true;
      }
    }

    // Anything standing in it catches fire
    for (const enemy of this.game.entities.getByFilter(isEnemy)) {
      this.burnIfInFire(enemy);
    }
    for (const human of this.game.entities.getByFilter(isHuman)) {
      this.burnIfInFire(human);
    }
  }

  private burnIfInFire(target: Parameters<typeof ignite>[0]) {
    const cell = this.cellAt(target.getPosition());
    if (cell >= 0 && this.burnAge[cell] >= 0) {
      ignite(target, this.sources.get(cell));
    }
  }

  private *neighbors(cell: number): Generator<number> {
    const column = cell % this.columns;
    const row = Math.floor(cell / this.columns);
    for (const [dx, dy] of NEIGHBORS) {
      const c = column + dx;
      const r = row + dy;
      if (c >= 0 && r >= 0 && c < this.columns && r < this.rows) {
        yield r * this.columns + c;
      }
    }
  }

  /** Whether a wall (or a closed door) is between the middles of two cells */
  private isWallBetween(a: number, b: number): boolean {
    return (
      this.game.world.raycast(this.cellCenter(a), this.cellCenter(b), {
        collisionMask: CollisionGroups.Walls,
        skipBackfaces: true,
      }) != null
    );
  }

  @on("render")
  onRender() {
    if (this.floorDirty) {
      this.floorDirty = false;
      this.drawFloor();
    }
    this.drawFire();
    if (this.lightMode === "cells") {
      this.updateCellLights();
    } else if (this.lightMode === "patches") {
      this.updateLights();
    }
  }

  /** One small, dim light per burning cell, each flickering on its own */
  private updateCellLights() {
    for (const [cell, light] of this.cellLights) {
      if (this.burnAge[cell] < 0) {
        light.destroy();
        this.cellLights.delete(cell);
      }
    }
    const t = this.game.elapsedUnpausedTime;
    for (const cell of this.burningCells) {
      let light = this.cellLights.get(cell);
      if (!light) {
        light = this.addChild(
          new PointLight({
            radius: CELL_LIGHT_RADIUS,
            intensity: 0,
            position: this.cellCenter(cell),
          }),
        );
        this.cellLights.set(cell, light);
      }
      const { intensity, color } = fireLightFlicker(t, cell * 0.37);
      light.setIntensity(CELL_LIGHT_INTENSITY * intensity);
      light.setColor(color);
    }
  }

  private drawFloor() {
    const g = this.floorGraphics.clear();
    const size = FIRE_CELL_SIZE;
    for (let cell = 0; cell < this.fuel.length; cell++) {
      const fuel = this.fuel[cell];
      if (fuel <= 0 && !this.scorched[cell]) {
        continue;
      }
      const [x, y] = this.cellCenter(cell);
      if (fuel > 0) {
        g.rect(x - size / 2, y - size / 2, size, size).fill({
          color: 0x2a2410,
          alpha: 0.25 + 0.3 * clamp(fuel / 8),
        });
      } else {
        g.rect(x - size / 2, y - size / 2, size, size).fill({
          color: 0x000000,
          alpha: 0.45,
        });
      }
    }
  }

  private drawFire() {
    const g = this.fireGraphics.clear();
    const t = this.game.elapsedUnpausedTime;
    for (const cell of this.burningCells) {
      const [x, y] = this.cellCenter(cell);
      // Grows in over the first moments, and shrinks as the fuel runs out
      const size =
        FIRE_CELL_SIZE *
        clamp(this.burnAge[cell] / 0.15) *
        (0.5 + 0.5 * clamp(this.fuel[cell] / 1.5)) *
        (1.1 + 0.25 * flicker(t, cell * 0.37));
      g.rect(x - size / 2, y - size / 2, size, size)
        .fill({ color: 0xff4400, alpha: 0.6 })
        .rect(x - size / 4, y - size / 4, size / 2, size / 2)
        .fill({ color: 0xffcc55, alpha: 0.5 });
    }
  }

  /**
   * One light per patch of fire: burning cells are gathered into patches
   * about `FIRE_LIGHT_PATCH_RADIUS` across, each lit from its middle, and each
   * patch keeps the light (and flicker) of the nearest patch last frame. Few
   * big lights rather than many small ones, because overlapping lights add up
   * to white.
   */
  private updateLights() {
    const patches: {
      x: number;
      y: number;
      count: number;
      sx: number;
      sy: number;
    }[] = [];
    for (const cell of this.burningCells) {
      const [x, y] = this.cellCenter(cell);
      let patch = patches.find(
        (p) => Math.hypot(p.sx - x, p.sy - y) < FIRE_LIGHT_PATCH_RADIUS,
      );
      if (!patch) {
        patch = { x: 0, y: 0, count: 0, sx: x, sy: y };
        patches.push(patch);
      }
      patch.x += x;
      patch.y += y;
      patch.count += 1;
    }

    const t = this.game.elapsedUnpausedTime;
    const unmatched = new Set(this.lights);
    const lights: FireLight[] = [];
    for (const { x, y, count } of patches) {
      const center = V(x / count, y / count);
      let nearest: FireLight | undefined;
      for (const light of unmatched) {
        const distance = light.center.distanceTo(center);
        if (
          distance < FIRE_LIGHT_PATCH_RADIUS &&
          (!nearest || distance < nearest.center.distanceTo(center))
        ) {
          nearest = light;
        }
      }
      const fireLight = nearest ?? {
        light: this.addChild(new PointLight({ intensity: 0 })),
        center,
        phase: (this.nextLightPhase += 2.3),
      };
      unmatched.delete(fireLight);
      fireLight.center = center;
      lights.push(fireLight);

      const amount = Math.sqrt(count / FIRE_LIGHT_FULL_PATCH);
      const { intensity, color, offset } = fireLightFlicker(t, fireLight.phase);
      fireLight.light.setPosition(center.add(offset));
      fireLight.light.setRadius(
        FIRE_LIGHT_MIN_RADIUS + FIRE_LIGHT_EXTRA_RADIUS * Math.min(amount, 1),
      );
      fireLight.light.setIntensity(intensity);
      fireLight.light.setColor(color);
    }
    for (const { light } of unmatched) {
      light.destroy();
    }
    this.lights = lights;
  }
}

/** The light of a patch of fire */
interface FireLight {
  light: PointLight;
  /** The middle of its patch, without the flicker */
  center: V2d;
  /** So that patches don't flicker in step */
  phase: number;
}

/** The fire grid of the run, or undefined outside of one (in the lobby) */
export function getFireGrid(game: Game): FireGrid | undefined {
  return game.entities.getByConstructor(FireGrid)[0];
}

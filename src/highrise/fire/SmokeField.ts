import {
  BufferImageSource,
  Container,
  GlProgram,
  Mesh,
  MeshGeometry,
  Shader,
} from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { clamp } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import Burning from "./Burning";
import {
  FIRE_CELL_SIZE,
  SMOKE_ALPHA,
  SMOKE_CLEAR_TIME,
  SMOKE_FADE_RATE,
  SMOKE_COLOR,
  SMOKE_DARK_COLOR,
  SMOKE_DARK_DENSITY,
  SMOKE_FROM_BURNING,
  SMOKE_FROM_CELL,
  SMOKE_MAX_DENSITY,
  SMOKE_SPREAD,
  SMOKE_TUNNEL_EDGE,
  SMOKE_TUNNEL_PUSH,
  SMOKE_TUNNEL_TIME,
  SMOKE_WARP,
} from "./fireConstants";
import type FireGrid from "./FireGrid";
import frag_smoke from "./smoke.frag?raw";
import vert_flames from "./flames.vert?raw";
import { gpuTimed } from "../../core/util/GpuProfiler";

/** Below this, a cell has no smoke */
const EMPTY = 0.005;

/** Columns and rows, inclusive */
interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
const NOTHING_PAINTED: Box = {
  left: Infinity,
  top: Infinity,
  right: -1,
  bottom: -1,
};

/**
 * Smoke as a density in each cell of the fire grid. Fire and burning things
 * put smoke into their cells; each tick smoke flows from each cell into the
 * neighbors that have less, unless a wall is between them, so it fills rooms,
 * pours out of doorways and piles up against walls, and it slowly clears.
 * Only the box around the cells with smoke is simulated, as a plain sweep
 * over the arrays (a set of the smoky cells was ten times slower). It's drawn
 * by `smoke.frag` from a texture of the densities (one pixel per cell), with
 * slow, billowing noise over it so the cells don't show, under the lighting
 * so fire lights it.
 */
export default class SmokeField extends BaseEntity implements Entity {
  tickLayer = "fire" as const;
  sprite: Container & GameSprite;
  private density = new Float32Array(0);
  private change = new Float32Array(0);
  /**
   * How much of each cell's smoke is hidden, 0 to 1, where something (a
   * bullet) just went through: the tunnel it leaves closes up as this fades,
   * rather than as fast as smoke spreads
   */
  private clearing = new Float32Array(0);
  /** The cells with some clearing */
  private clearingCells = new Set<number>();
  /**
   * The columns and rows of the box around every cell with smoke (empty when
   * `boxRight < boxLeft`)
   */
  private boxLeft = 0;
  private boxTop = 0;
  private boxRight = -1;
  private boxBottom = -1;
  /** How many cells had smoke after the last tick */
  private smokyCells = 0;
  /** The box of the texture that might have something in it (see `paint`) */
  private painted: Box = NOTHING_PAINTED;
  /**
   * Whether a wall is past each cell's right edge (even indexes) and bottom
   * edge (odd): -1 until someone asks, then 0 or 1. Walls don't move, so
   * each edge is only checked once. (Doors aren't walls here.)
   */
  private walls = new Int8Array(0);
  private pixels = new Uint8Array(4);
  private source = new BufferImageSource({
    resource: this.pixels,
    width: 1,
    height: 1,
  });
  private mesh: Mesh<MeshGeometry, Shader>;
  private shader: Shader;
  private rect = new Float32Array(4);
  private texturesDirty = false;

  constructor(private grid: FireGrid) {
    super();
    this.shader = this.makeShader();
    this.mesh = new Mesh({
      geometry: new MeshGeometry({
        positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
      }),
      shader: this.shader,
    });
    this.sprite = gpuTimed("SmokeField.smoke", this.mesh);
    this.sprite.layerName = Layer.WORLD_FRONT;
  }

  private makeShader(): Shader {
    const rgb = (color: number) =>
      new Float32Array([
        ((color >> 16) & 0xff) / 255,
        ((color >> 8) & 0xff) / 255,
        (color & 0xff) / 255,
      ]);
    return new Shader({
      glProgram: GlProgram.from({
        vertex: vert_flames,
        fragment: frag_smoke,
        name: "smoke",
      }),
      resources: {
        uDensity: this.source,
        smokeUniforms: {
          uRect: { value: this.rect, type: "vec4<f32>" },
          uTime: { value: 0, type: "f32" },
          uSmokeColor: { value: rgb(SMOKE_COLOR), type: "vec3<f32>" },
          uDarkColor: { value: rgb(SMOKE_DARK_COLOR), type: "vec3<f32>" },
          uDarkDensity: { value: SMOKE_DARK_DENSITY, type: "f32" },
          uAlpha: { value: SMOKE_ALPHA, type: "f32" },
          uMaxDensity: { value: SMOKE_MAX_DENSITY, type: "f32" },
          uWarp: { value: SMOKE_WARP, type: "f32" },
        },
      },
    });
  }

  /** No smoke, sized to the grid (after the grid is reset) */
  reset() {
    const { columns, rows } = this.grid;
    const count = columns * rows;
    this.density = new Float32Array(count);
    this.change = new Float32Array(count);
    this.clearing = new Float32Array(count);
    this.clearingCells.clear();
    this.walls = new Int8Array(count * 2).fill(-1);
    this.emptyBox();
    this.smokyCells = 0;
    this.painted = NOTHING_PAINTED;

    this.pixels = new Uint8Array(count * 4);
    this.opaque();
    const oldSource = this.source;
    this.source = new BufferImageSource({
      resource: this.pixels,
      width: columns,
      height: rows,
      scaleMode: "linear",
    });
    // Swapped in before the old one goes, which the shader is still using
    this.shader.resources.uDensity = this.source;
    oldSource.destroy();
    const width = columns * FIRE_CELL_SIZE;
    const height = rows * FIRE_CELL_SIZE;
    this.rect.set([0, 0, width, height]);
    this.mesh.scale.set(width, height);
    this.texturesDirty = true;
  }

  /** Takes away all the smoke */
  clear() {
    this.density.fill(0);
    this.emptyBox();
    this.smokyCells = 0;
    this.clearing.fill(0);
    this.clearingCells.clear();
    this.pixels.fill(0);
    this.opaque();
    this.painted = NOTHING_PAINTED;
    this.texturesDirty = true;
  }

  /**
   * Alpha is always 1, since the texture is premultiplied when it's uploaded
   * and the shader only reads red and green
   */
  private opaque() {
    for (let i = 3; i < this.pixels.length; i += 4) {
      this.pixels[i] = 255;
    }
  }

  private emptyBox() {
    this.boxLeft = this.boxTop = 0;
    this.boxRight = this.boxBottom = -1;
  }

  /** Whether any cell might have smoke in it */
  private get hasSmoke(): boolean {
    return this.boxRight >= this.boxLeft;
  }

  /** How smoky `cell` is */
  densityAt(cell: number): number {
    return this.density[cell] ?? 0;
  }

  /**
   * A burst of smoke around `center`: `amount` in the middle, less towards
   * `radius` meters out, spreading out from the middle but not through walls
   */
  puff(center: V2d, radius: number, amount: number) {
    const grid = this.grid;
    const start = grid.cellAt(center);
    if (start < 0 || amount <= 0) {
      return;
    }
    const { columns, rows } = grid;
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length > 0) {
      const cell = queue.shift()!;
      const distance = grid.cellCenter(cell).distanceTo(center);
      if (cell !== start && distance > radius) {
        continue;
      }
      this.add(cell, amount * (1 - 0.7 * clamp(distance / radius)));
      const column = cell % columns;
      const row = (cell - column) / columns;
      const neighbors: [number, number][] = [];
      if (column + 1 < columns) neighbors.push([cell + 1, cell * 2]);
      if (column > 0) neighbors.push([cell - 1, (cell - 1) * 2]);
      if (row + 1 < rows) neighbors.push([cell + columns, cell * 2 + 1]);
      if (row > 0) neighbors.push([cell - columns, (cell - columns) * 2 + 1]);
      for (const [neighbor, edge] of neighbors) {
        if (!seen.has(neighbor) && !this.wallAlong(edge)) {
          seen.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    this.texturesDirty = true;
  }

  /** Puts `amount` of smoke into `cell` */
  add(cell: number, amount: number) {
    if (cell >= 0 && amount > 0) {
      this.density[cell] += amount;
      const column = cell % this.grid.columns;
      const row = (cell - column) / this.grid.columns;
      if (!this.hasSmoke) {
        this.boxLeft = this.boxRight = column;
        this.boxTop = this.boxBottom = row;
      } else {
        this.boxLeft = Math.min(this.boxLeft, column);
        this.boxRight = Math.max(this.boxRight, column);
        this.boxTop = Math.min(this.boxTop, row);
        this.boxBottom = Math.max(this.boxBottom, row);
      }
    }
  }

  @on("tick")
  onTick(dt: number) {
    const grid = this.grid;
    for (const cell of grid.burning) {
      this.add(cell, SMOKE_FROM_CELL * grid.cellHeat(cell) * dt);
    }
    for (const burning of this.game.entities.getByConstructor(Burning)) {
      this.add(
        grid.cellAt(burning.target.getPosition()),
        SMOKE_FROM_BURNING * dt,
      );
    }
    if (this.hasSmoke) {
      this.spread(dt);
      this.texturesDirty = true;
    }
    if (this.clearingCells.size > 0) {
      const fade = dt / SMOKE_TUNNEL_TIME;
      for (const cell of this.clearingCells) {
        this.clearing[cell] -= fade;
        if (this.clearing[cell] <= 0) {
          this.clearing[cell] = 0;
          this.clearingCells.delete(cell);
        }
      }
      this.texturesDirty = true;
    }
  }

  /**
   * Something fast went from `from` to `to` (a bullet): smoke in the cells
   * along the way is pushed out to the cells beside them, and hidden for a
   * moment, leaving a tunnel that closes up
   */
  disturb(from: V2d, to: V2d) {
    const length = from.distanceTo(to);
    if (length === 0 || !this.hasSmoke) {
      return;
    }
    const grid = this.grid;
    // Which neighbors are "beside" the path: across it, on the nearer axis
    const acrossX = Math.abs(to[1] - from[1]) > Math.abs(to[0] - from[0]);
    const sideways = acrossX ? 1 : grid.columns;
    const wallEdge = (cell: number, side: number) =>
      acrossX
        ? side > 0
          ? cell * 2
          : (cell - 1) * 2
        : side > 0
          ? cell * 2 + 1
          : (cell - grid.columns) * 2 + 1;

    const steps = Math.ceil(length / (FIRE_CELL_SIZE / 2));
    let last = -1;
    for (let i = 0; i <= steps; i++) {
      const cell = grid.cellAt(from.lerp(to, i / steps));
      if (cell < 0 || cell === last) {
        continue;
      }
      last = cell;
      this.hide(cell, 1);
      const pushed = this.density[cell] * SMOKE_TUNNEL_PUSH;
      if (pushed <= 0) {
        continue;
      }
      // Half to each side, or all to one if the other is behind a wall
      const sides = [-1, 1].filter(
        (side) =>
          grid.cellAt(
            grid
              .cellCenter(cell)
              .iadd(
                acrossX
                  ? [side * FIRE_CELL_SIZE, 0]
                  : [0, side * FIRE_CELL_SIZE],
              ),
          ) >= 0 && !this.wallAlong(wallEdge(cell, side)),
      );
      if (sides.length === 0) {
        continue;
      }
      this.density[cell] -= pushed;
      for (const side of sides) {
        const neighbor = cell + side * sideways;
        this.add(neighbor, pushed / sides.length);
        this.hide(neighbor, SMOKE_TUNNEL_EDGE);
      }
    }
    this.texturesDirty = true;
  }

  private hide(cell: number, amount: number) {
    if (amount > this.clearing[cell]) {
      this.clearing[cell] = amount;
      this.clearingCells.add(cell);
    }
  }

  /**
   * Each cell gives some of the difference to each neighbor with less smoke
   * that isn't behind a wall; everything thins out a little. Sweeps the box
   * around the smoke and one cell past it, which is as far as smoke can get
   * in a tick, and shrinks the box to what's left.
   */
  private spread(dt: number) {
    const { columns, rows } = this.grid;
    const density = this.density;
    const change = this.change;
    const walls = this.walls;
    const rate = Math.min(0.24, SMOKE_SPREAD * dt);
    const left = Math.max(0, this.boxLeft - 1);
    const right = Math.min(columns - 1, this.boxRight + 1);
    const top = Math.max(0, this.boxTop - 1);
    const bottom = Math.min(rows - 1, this.boxBottom + 1);

    // The flow across each edge, once: to the right and down from each cell
    for (let row = top; row <= bottom; row++) {
      let cell = row * columns + left;
      for (let column = left; column <= right; column++, cell++) {
        const d = density[cell];
        if (column < right) {
          const difference = d - density[cell + 1];
          if (
            difference !== 0 &&
            (walls[cell * 2] === 0 ||
              (walls[cell * 2] < 0 && !this.wallAlong(cell * 2)))
          ) {
            const flow = difference * rate;
            change[cell] -= flow;
            change[cell + 1] += flow;
          }
        }
        if (row < bottom) {
          const difference = d - density[cell + columns];
          if (
            difference !== 0 &&
            (walls[cell * 2 + 1] === 0 ||
              (walls[cell * 2 + 1] < 0 && !this.wallAlong(cell * 2 + 1)))
          ) {
            const flow = difference * rate;
            change[cell] -= flow;
            change[cell + columns] += flow;
          }
        }
      }
    }

    // Thinning out: a fraction of what's there (which thins thick smoke) and
    // a fixed amount (which finishes off thin smoke, rather than letting it
    // linger and creep through the level forever)
    const keep = Math.exp(-dt / SMOKE_CLEAR_TIME);
    const fade = SMOKE_FADE_RATE * dt;
    let smoky = 0;
    let newLeft = columns;
    let newRight = -1;
    let newTop = rows;
    let newBottom = -1;
    for (let row = top; row <= bottom; row++) {
      let cell = row * columns + left;
      for (let column = left; column <= right; column++, cell++) {
        const d = (density[cell] + change[cell]) * keep - fade;
        change[cell] = 0;
        if (d < EMPTY) {
          density[cell] = 0;
        } else {
          density[cell] = d;
          smoky++;
          if (column < newLeft) newLeft = column;
          if (column > newRight) newRight = column;
          if (row < newTop) newTop = row;
          newBottom = row;
        }
      }
    }
    this.smokyCells = smoky;
    if (smoky === 0) {
      this.emptyBox();
    } else {
      this.boxLeft = newLeft;
      this.boxRight = newRight;
      this.boxTop = newTop;
      this.boxBottom = newBottom;
    }
  }

  /** How many cells have smoke in them */
  get activeCount(): number {
    return this.smokyCells;
  }

  /**
   * Whether a wall is along edge `edge`: a cell's index times two for its
   * right edge, plus one for its bottom edge (see `walls`)
   */
  wallAlong(edge: number): boolean {
    let wall = this.walls[edge];
    if (wall < 0) {
      const cell = edge >> 1;
      const neighbor = edge & 1 ? cell + this.grid.columns : cell + 1;
      const hit = this.game.world.raycast(
        this.grid.cellCenter(cell),
        this.grid.cellCenter(neighbor),
        {
          collisionMask: CollisionGroups.Walls,
          skipBackfaces: true,
          filter: (body) => body.motion === "static",
        },
      );
      wall = hit ? 1 : 0;
      this.walls[edge] = wall;
    }
    return wall === 1;
  }

  @on("render")
  onRender() {
    this.mesh.visible = this.hasSmoke || this.clearingCells.size > 0;
    const uniforms = this.shader.resources.smokeUniforms.uniforms;
    uniforms.uTime = this.game.elapsedUnpausedTime;
    if (this.texturesDirty) {
      this.texturesDirty = false;
      this.paint();
      this.source.update();
    }
  }

  /**
   * Writes the densities into the texture's red and how much of each cell is
   * hidden (tunnels) into its green, over the box of the smoke and tunnels
   * and whatever was painted last time (so what's gone is cleared)
   */
  private paint() {
    const { columns } = this.grid;
    const pixels = this.pixels;
    const density = this.density;
    const clearing = this.clearing;

    // The box that will have something in it after this
    let left = this.boxLeft;
    let right = this.boxRight;
    let top = this.boxTop;
    let bottom = this.boxBottom;
    if (!this.hasSmoke) {
      left = top = Infinity;
      right = bottom = -1;
    }
    for (const cell of this.clearingCells) {
      const column = cell % columns;
      const row = (cell - column) / columns;
      left = Math.min(left, column);
      right = Math.max(right, column);
      top = Math.min(top, row);
      bottom = Math.max(bottom, row);
    }
    const painted = this.painted;
    const fromLeft = Math.min(left, painted.left);
    const toRight = Math.max(right, painted.right);
    const fromTop = Math.min(top, painted.top);
    const toBottom = Math.max(bottom, painted.bottom);

    for (let row = fromTop; row <= toBottom; row++) {
      let cell = row * columns + fromLeft;
      for (let column = fromLeft; column <= toRight; column++, cell++) {
        const value = density[cell] / SMOKE_MAX_DENSITY;
        pixels[cell * 4] = value >= 1 ? 255 : Math.round(value * 255);
        // Tunnels close up with an ease, not a steady fade
        const hidden = clearing[cell];
        pixels[cell * 4 + 1] = Math.round(
          hidden * hidden * (3 - 2 * hidden) * 255,
        );
      }
    }
    if (right >= left) {
      this.painted = { left, top, right, bottom };
    } else {
      this.painted = NOTHING_PAINTED;
    }
  }

  @on("destroy")
  onDestroy() {
    this.source.destroy();
  }
}

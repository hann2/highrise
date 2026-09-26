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
import Burning from "./Burning";
import {
  FIRE_CELL_SIZE,
  SMOKE_ALPHA,
  SMOKE_CLEAR_TIME,
  SMOKE_COLOR,
  SMOKE_FROM_BURNING,
  SMOKE_FROM_CELL,
  SMOKE_MAX_DENSITY,
  SMOKE_SPREAD,
  SMOKE_WARP,
} from "./fireConstants";
import type FireGrid from "./FireGrid";
import frag_smoke from "./smoke.frag";
import vert_flames from "./flames.vert";

/** Below this, a cell has no smoke */
const EMPTY = 0.002;

/**
 * Smoke as a density in each cell of the fire grid. Fire and burning things
 * put smoke into their cells; each tick smoke flows from each cell into the
 * neighbors that have less, unless a wall is between them, so it fills rooms,
 * pours out of doorways and piles up against walls, and it slowly clears.
 * Only cells with smoke are simulated. It's drawn by `smoke.frag` from a
 * texture of the densities (one pixel per cell), with slow, billowing noise
 * over it so the cells don't show, under the lighting so fire lights it.
 */
export default class SmokeField extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  private density = new Float32Array(0);
  private change = new Float32Array(0);
  /** The cells with smoke in them */
  private active = new Set<number>();
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
    this.sprite = new Container();
    this.sprite.layerName = Layer.WORLD_FRONT;
    this.sprite.addChild(this.mesh);
  }

  private makeShader(): Shader {
    const color = [
      ((SMOKE_COLOR >> 16) & 0xff) / 255,
      ((SMOKE_COLOR >> 8) & 0xff) / 255,
      (SMOKE_COLOR & 0xff) / 255,
    ];
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
          uSmokeColor: { value: new Float32Array(color), type: "vec3<f32>" },
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
    this.walls = new Int8Array(count * 2).fill(-1);
    this.active.clear();

    this.pixels = new Uint8Array(count * 4);
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
    this.active.clear();
    this.texturesDirty = true;
  }

  /** How smoky `cell` is */
  densityAt(cell: number): number {
    return this.density[cell] ?? 0;
  }

  /** Puts `amount` of smoke into `cell` */
  add(cell: number, amount: number) {
    if (cell >= 0 && amount > 0) {
      this.density[cell] += amount;
      this.active.add(cell);
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
    if (this.active.size > 0) {
      this.spread(dt);
      this.texturesDirty = true;
    }
  }

  /**
   * Each cell gives some of the difference to each neighbor with less smoke
   * that isn't behind a wall; everything thins out a little
   */
  private spread(dt: number) {
    const { columns, rows } = this.grid;
    const density = this.density;
    const change = this.change;
    const rate = Math.min(0.24, SMOKE_SPREAD * dt);
    const touched = new Set<number>();
    for (const cell of this.active) {
      const d = density[cell];
      const column = cell % columns;
      const row = (cell - column) / columns;
      touched.add(cell);
      const give = (neighbor: number, wallEdge: number) => {
        const difference = d - density[neighbor];
        if (difference > 0 && !this.wallAlong(wallEdge)) {
          const flow = difference * rate;
          change[cell] -= flow;
          change[neighbor] += flow;
          touched.add(neighbor);
        }
      };
      if (column + 1 < columns) give(cell + 1, cell * 2);
      if (column > 0) give(cell - 1, (cell - 1) * 2);
      if (row + 1 < rows) give(cell + columns, cell * 2 + 1);
      if (row > 0) give(cell - columns, (cell - columns) * 2 + 1);
    }
    const keep = Math.exp(-dt / SMOKE_CLEAR_TIME);
    for (const cell of touched) {
      const d = (density[cell] + change[cell]) * keep;
      change[cell] = 0;
      if (d < EMPTY) {
        density[cell] = 0;
        this.active.delete(cell);
      } else {
        density[cell] = d;
        this.active.add(cell);
      }
    }
  }

  /** How many cells have smoke in them */
  get activeCount(): number {
    return this.active.size;
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
    this.mesh.visible = this.active.size > 0;
    const uniforms = this.shader.resources.smokeUniforms.uniforms;
    uniforms.uTime = this.game.elapsedUnpausedTime;
    if (this.texturesDirty) {
      this.texturesDirty = false;
      const pixels = this.pixels;
      pixels.fill(0);
      for (const cell of this.active) {
        const value = clamp(this.density[cell] / SMOKE_MAX_DENSITY);
        pixels[cell * 4] = Math.round(value * 255);
        pixels[cell * 4 + 3] = 255;
      }
      this.source.update();
    }
  }

  @on("destroy")
  onDestroy() {
    this.source.destroy();
  }
}

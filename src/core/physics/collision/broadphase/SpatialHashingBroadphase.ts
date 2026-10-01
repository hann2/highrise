import { mod } from "../../../util/MathUtil";
import type { Body } from "../../body/Body";
import { hasOnlyParticleShapes } from "../../body/body-helpers";
import { World } from "../../world/World";
import { CompatibleVector } from "../../../Vector";
import { AABB } from "../AABB";
import { bodiesCanCollide } from "../CollisionHelpers";
import { Broadphase } from "./Broadphase";

const HUGE_LIMIT = 200;
const DEFAULT_CELL_SIZE = 6;

/**
 * A spatial hashing broadphase: space is divided into a grid of cells (which
 * wraps around, so the grid only has to cover the area where things are
 * close together), and each body is listed in every cell its AABB overlaps.
 * Bodies too big for that ("huge") are kept in a list of their own.
 *
 * There are two hashes. Static bodies go in one when they're added and stay
 * there. Everything that moves (dynamic, kinematic and particle bodies) goes
 * in the other, which is brought up to date when it's needed after each
 * physics step, since bodies have moved: only bodies whose AABBs now cover
 * different cells are moved, which for most bodies most steps is none. Bodies
 * added or removed are put in or taken out of it right away, so queries
 * between steps (like raycasts during a tick) cost nothing extra however many
 * bodies there are.
 *
 * Between steps, the moving hash holds bodies where their AABBs were when it
 * was updated. That's the same as the AABBs themselves: moving a body by hand
 * doesn't update its AABB either until the next step.
 *
 * Each body remembers which cells it was put in, so taking it out never
 * depends on where it is now.
 */
export class SpatialHashingBroadphase extends Broadphase {
  pointShapeBodies: Set<Body> = new Set();
  dynamicBodies: Set<Body> = new Set();
  kinematicBodies: Set<Body> = new Set();
  /** Static bodies too big for the grid */
  hugeBodies: Set<Body> = new Set();
  /** The static hash: the static bodies in each cell */
  partitions: Body[][] = [];

  debugData = {
    numCollisions: 0,
    /** How many times the moving hash has been brought up to date */
    movingUpdates: 0,
    /** How many moving bodies have changed cells, all told */
    movingRehashes: 0,
  };

  private cellSize: number;
  private width: number;
  private height: number;

  /** The cells each static body is in (empty for huge ones) */
  private staticCells = new Map<Body, number[]>();

  /** The moving hash: the moving bodies in each cell */
  private movingPartitions: Body[][] = [];
  /** Moving bodies too big for the grid */
  private movingHuge: Body[] = [];
  /** Where each moving body is in the moving hash */
  private movingEntries = new Map<Body, HashEntry>();
  /** Whether bodies may have moved since the moving hash was updated */
  private movingDirty = true;

  /** Marks the bodies a query has already seen (see `Body._queryStamp`) */
  private stamp = 0;

  constructor({
    cellSize = DEFAULT_CELL_SIZE,
    width = 24,
    height = 24,
  }: { cellSize?: number; width?: number; height?: number } = {}) {
    super();

    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.makePartitions();
  }

  private makePartitions() {
    const count = this.width * this.height;
    this.partitions = Array.from({ length: count }, () => []);
    this.movingPartitions = Array.from({ length: count }, () => []);
    this.movingHuge = [];
    this.movingEntries.clear();
    this.movingDirty = true;
  }

  setWorld(world: World) {
    super.setWorld.call(this, world);

    world.on("addBody", ((e: { body: Body }) => this.onAddBody(e.body)) as any);
    world.on("removeBody", ((e: { body: Body }) =>
      this.onRemoveBody(e.body)) as any);
    // Everything that moves has moved
    world.on("postStep", () => {
      this.movingDirty = true;
    });
  }

  resize(cellSize: number, width: number, height: number) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    const statics = [...this.staticCells.keys()];
    this.staticCells.clear();
    this.hugeBodies.clear();
    this.makePartitions();
    for (const body of statics) {
      this.addStatic(body);
    }
    for (const body of this.movingBodies()) {
      this.placeMoving(body);
    }
  }

  private *movingBodies(): Iterable<Body> {
    yield* this.kinematicBodies;
    yield* this.dynamicBodies;
    yield* this.pointShapeBodies;
  }

  onAddBody(body: Body) {
    if (body.motion === "static") {
      this.addStatic(body);
      return;
    }
    if (body.motion === "dynamic") {
      if (hasOnlyParticleShapes(body)) {
        this.pointShapeBodies.add(body);
      } else {
        this.dynamicBodies.add(body);
      }
    } else {
      this.kinematicBodies.add(body);
    }
    this.placeMoving(body);
  }

  onRemoveBody(body: Body) {
    if (body.motion === "static") {
      this.removeStatic(body);
      return;
    }
    this.dynamicBodies.delete(body);
    this.pointShapeBodies.delete(body);
    this.kinematicBodies.delete(body);
    this.removeMoving(body);
  }

  bodyShapesChanged(body: Body) {
    if (body.motion === "static") {
      if (this.staticCells.has(body)) {
        this.removeStatic(body);
        this.addStatic(body);
      }
    } else if (body.world) {
      // It may have become (or stopped being) a particle body
      this.onRemoveBody(body);
      this.onAddBody(body);
    }
  }

  private addStatic(body: Body) {
    const cells = this.aabbToCells(body.getAABB());
    this.staticCells.set(body, cells ?? []);
    if (cells === undefined) {
      this.hugeBodies.add(body);
    } else {
      for (const cell of cells) {
        this.partitions[cell].push(body);
      }
    }
  }

  private removeStatic(body: Body) {
    const cells = this.staticCells.get(body);
    if (cells === undefined) {
      return;
    }
    this.staticCells.delete(body);
    this.hugeBodies.delete(body);
    for (const cell of cells) {
      removeFrom(this.partitions[cell], body);
    }
  }

  /**
   * Puts a moving body in the cells its AABB covers, unless it's already in
   * exactly those (or is huge, and still is)
   */
  private placeMoving(body: Body) {
    const entry = this.movingEntries.get(body);
    const aabb = body.getAABB();
    const lowX = Math.floor(aabb.lowerBound[0] / this.cellSize);
    const lowY = Math.floor(aabb.lowerBound[1] / this.cellSize);
    const highX = Math.floor(aabb.upperBound[0] / this.cellSize);
    const highY = Math.floor(aabb.upperBound[1] / this.cellSize);
    if (
      entry &&
      entry.lowX === lowX &&
      entry.lowY === lowY &&
      entry.highX === highX &&
      entry.highY === highY
    ) {
      return;
    }
    this.debugData.movingRehashes += 1;
    if (entry) {
      this.removeMoving(body);
    }
    const huge = isHuge(lowX, lowY, highX, highY);
    const cells = huge ? [] : this.cellsInRange(lowX, lowY, highX, highY);
    this.movingEntries.set(body, { lowX, lowY, highX, highY, cells });
    if (huge) {
      this.movingHuge.push(body);
    }
    for (const cell of cells) {
      this.movingPartitions[cell].push(body);
    }
  }

  private removeMoving(body: Body) {
    const entry = this.movingEntries.get(body);
    if (entry === undefined) {
      return;
    }
    this.movingEntries.delete(body);
    if (entry.cells.length === 0) {
      removeFrom(this.movingHuge, body);
    }
    for (const cell of entry.cells) {
      removeFrom(this.movingPartitions[cell], body);
    }
  }

  /** Brings the moving hash up to date, if bodies may have moved since it was */
  private updateMovingHash() {
    if (!this.movingDirty) {
      return;
    }
    this.movingDirty = false;
    this.debugData.movingUpdates += 1;
    for (const body of this.kinematicBodies) {
      this.placeMoving(body);
    }
    for (const body of this.dynamicBodies) {
      this.placeMoving(body);
    }
    for (const body of this.pointShapeBodies) {
      this.placeMoving(body);
    }
  }

  getCollisionPairs(_world: World): [Body, Body][] {
    this.updateMovingHash();
    const result: [Body, Body][] = [];

    // Every pair has a dynamic body in it (static and kinematic bodies don't
    // collide with each other), so it's enough to look around each dynamic
    // body. A pair of two dynamic bodies is found from the one with the lower
    // id, and a particle body's pairs from the particle body (particles don't
    // collide with each other).
    for (const body of this.dynamicBodies) {
      this.pairsOf(body, false, result);
    }
    for (const body of this.pointShapeBodies) {
      this.pairsOf(body, true, result);
    }

    this.debugData.numCollisions = result.length;
    return result;
  }

  /** Adds the pairs of `body` (see `getCollisionPairs`) to `result` */
  private pairsOf(body: Body, isParticle: boolean, result: [Body, Body][]) {
    const aabb = body.getAABB();
    const stamp = ++this.stamp;
    body._queryStamp = stamp;

    const consider = (other: Body) => {
      if (other._queryStamp === stamp) {
        return;
      }
      other._queryStamp = stamp;
      if (other.motion === "dynamic") {
        const otherIsParticle = this.pointShapeBodies.has(other);
        if (
          isParticle ? otherIsParticle : otherIsParticle || other.id < body.id
        ) {
          return;
        }
      }
      if (other.getAABB().overlaps(aabb) && bodiesCanCollide(body, other)) {
        result.push([body, other]);
      }
    };

    const cells = this.queryCells(aabb);
    for (const cell of cells) {
      for (const other of this.partitions[cell]) {
        consider(other);
      }
    }
    for (const other of this.hugeBodies) {
      consider(other);
    }
    for (const cell of cells) {
      for (const other of this.movingPartitions[cell]) {
        consider(other);
      }
    }
    for (const other of this.movingHuge) {
      consider(other);
    }
  }

  xyToCell(x: number, y: number) {
    return mod(x, this.width) + mod(y, this.height) * this.width;
  }

  /** The cells a body with this AABB goes in, or undefined if it's "huge" */
  aabbToCells(aabb: AABB): number[] | undefined {
    const lowX = Math.floor(aabb.lowerBound[0] / this.cellSize);
    const lowY = Math.floor(aabb.lowerBound[1] / this.cellSize);
    const highX = Math.floor(aabb.upperBound[0] / this.cellSize);
    const highY = Math.floor(aabb.upperBound[1] / this.cellSize);
    if (isHuge(lowX, lowY, highX, highY)) {
      return undefined;
    }
    return this.cellsInRange(lowX, lowY, highX, highY);
  }

  /** The cells an AABB overlaps (see `cellsInRange`) */
  private queryCells(aabb: AABB): number[] {
    return this.cellsInRange(
      Math.floor(aabb.lowerBound[0] / this.cellSize),
      Math.floor(aabb.lowerBound[1] / this.cellSize),
      Math.floor(aabb.upperBound[0] / this.cellSize),
      Math.floor(aabb.upperBound[1] / this.cellSize),
    );
  }

  /**
   * The cells from column `lowX` to `highX` and row `lowY` to `highY`, each
   * once: a range wider or taller than the grid covers every column or row
   */
  private cellsInRange(
    lowX: number,
    lowY: number,
    highX: number,
    highY: number,
  ): number[] {
    const result: number[] = [];
    if (!(highX - lowX < this.width)) {
      lowX = 0;
      highX = this.width - 1;
    }
    if (!(highY - lowY < this.height)) {
      lowY = 0;
      highY = this.height - 1;
    }
    for (let x = lowX; x <= highX; x++) {
      for (let y = lowY; y <= highY; y++) {
        result.push(this.xyToCell(x, y));
      }
    }
    return result;
  }

  /**
   * The bodies whose AABBs overlap `aabb`.
   * @param includeMoving Whether to include dynamic, kinematic and particle
   *   bodies, or only static ones
   */
  aabbQuery(
    _: World,
    aabb: AABB,
    includeMoving: boolean = true,
  ): Iterable<Body> {
    const result: Body[] = [];
    const stamp = ++this.stamp;
    const consider = (body: Body) => {
      if (body._queryStamp !== stamp) {
        body._queryStamp = stamp;
        if (body.getAABB().overlaps(aabb)) {
          result.push(body);
        }
      }
    };

    const cells = this.queryCells(aabb);
    for (const cell of cells) {
      for (const body of this.partitions[cell]) {
        consider(body);
      }
    }
    for (const body of this.hugeBodies) {
      consider(body);
    }

    if (includeMoving) {
      this.updateMovingHash();
      for (const cell of cells) {
        for (const body of this.movingPartitions[cell]) {
          consider(body);
        }
      }
      for (const body of this.movingHuge) {
        consider(body);
      }
    }

    return result;
  }

  /**
   * The bodies in the cells a ray from `from` to `to` passes through, found by
   * walking the grid along the ray (DDA, as in Amanatides & Woo), so a long
   * diagonal ray only looks at the cells it crosses rather than every cell of
   * its bounding box. A body is in every cell its AABB overlaps, so anything
   * the ray could hit is among them; they still need testing against the ray.
   * @param includeMoving Whether to include dynamic, kinematic and particle
   *   bodies, or only static ones
   */
  rayQuery(
    world: World,
    from: CompatibleVector,
    to: CompatibleVector,
    includeMoving: boolean = true,
  ): Iterable<Body> {
    const x1 = from[0] / this.cellSize;
    const y1 = from[1] / this.cellSize;
    const x2 = to[0] / this.cellSize;
    const y2 = to[1] / this.cellSize;
    if (![x1, y1, x2, y2].every(Number.isFinite)) {
      return super.rayQuery(world, from, to, includeMoving);
    }
    if (includeMoving) {
      this.updateMovingHash();
    }

    const result: Body[] = [];
    const stamp = ++this.stamp;
    const consider = (body: Body) => {
      if (body._queryStamp !== stamp) {
        body._queryStamp = stamp;
        result.push(body);
      }
    };
    const addCell = (cx: number, cy: number) => {
      const cell = this.xyToCell(cx, cy);
      for (const body of this.partitions[cell]) {
        consider(body);
      }
      if (includeMoving) {
        for (const body of this.movingPartitions[cell]) {
          consider(body);
        }
      }
    };

    let cellX = Math.floor(x1);
    let cellY = Math.floor(y1);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);
    // How far along the ray (0 to 1) it takes to cross a whole cell
    const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Infinity;
    // How far along the ray the next cell boundary is crossed
    let tMaxX =
      stepX > 0
        ? (Math.floor(x1) + 1 - x1) * tDeltaX
        : stepX < 0
          ? (x1 - Math.floor(x1)) * tDeltaX
          : Infinity;
    let tMaxY =
      stepY > 0
        ? (Math.floor(y1) + 1 - y1) * tDeltaY
        : stepY < 0
          ? (y1 - Math.floor(y1)) * tDeltaY
          : Infinity;

    // The walk takes exactly this many steps in each direction, so it always
    // ends in the end cell, however the rounding goes along the way
    let stepsX = Math.abs(Math.floor(x2) - cellX);
    let stepsY = Math.abs(Math.floor(y2) - cellY);
    addCell(cellX, cellY);
    while (stepsX > 0 || stepsY > 0) {
      if (stepsX > 0 && (stepsY === 0 || tMaxX < tMaxY)) {
        tMaxX += tDeltaX;
        cellX += stepX;
        stepsX -= 1;
      } else {
        tMaxY += tDeltaY;
        cellY += stepY;
        stepsY -= 1;
      }
      addCell(cellX, cellY);
    }

    // Huge bodies aren't in the grid
    for (const body of this.hugeBodies) {
      consider(body);
    }
    if (includeMoving) {
      for (const body of this.movingHuge) {
        consider(body);
      }
    }

    return result;
  }
}

/** Where a moving body is in the moving hash: the cell range its AABB covered, and those cells (none if it's huge) */
interface HashEntry {
  lowX: number;
  lowY: number;
  highX: number;
  highY: number;
  cells: number[];
}

/** Whether a body covering this cell range is too big for the grid */
function isHuge(lowX: number, lowY: number, highX: number, highY: number) {
  return (
    !isFinite(lowX) ||
    !isFinite(lowY) ||
    !isFinite(highX) ||
    !isFinite(highY) ||
    Math.abs(highX - lowX) * Math.abs(highY - lowY) > HUGE_LIMIT
  );
}

/** Removes `item` from `list` if it's there, without keeping the order */
function removeFrom<T>(list: T[], item: T) {
  const index = list.indexOf(item);
  if (index >= 0) {
    list[index] = list[list.length - 1];
    list.pop();
  }
}

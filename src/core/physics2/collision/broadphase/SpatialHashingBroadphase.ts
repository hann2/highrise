import { mod } from "../../../util/MathUtil";
import type { Body } from "../../body/Body";
import { hasOnlyParticleShapes } from "../../body/body-helpers";
import { World } from "../../world/World";
import { RayLike, AABB } from "../AABB";
import { bodiesCanCollide } from "../CollisionHelpers";
import { Broadphase } from "./Broadphase";

const HUGE_LIMIT = 200;
const DEFAULT_CELL_SIZE = 6;
const HUGE: number[] = []; // Sentinel value for huge bodies

/**
 * A spatial hashing broadphase collision detection system that divides
 * space into uniform grid cells. Provides efficient collision pair detection
 * by only checking bodies within the same cells.
 */
export class SpatialHashingBroadphase extends Broadphase {
  pointShapeBodies: Set<Body> = new Set();
  dynamicBodies: Set<Body> = new Set();
  kinematicBodies: Set<Body> = new Set();
  hugeBodies: Set<Body> = new Set();
  partitions: Set<Body>[] = [];

  bodiesAdded: boolean = false;

  debugData = {
    numCollisions: 0,
  };

  private cellSize: number;
  private width: number;
  private height: number;

  constructor({
    cellSize = DEFAULT_CELL_SIZE,
    width = 24,
    height = 24,
  }: { cellSize?: number; width?: number; height?: number } = {}) {
    super();

    this.cellSize = cellSize;
    this.width = width;
    this.height = height;

    for (let i = 0; i < width * height; i++) {
      this.partitions.push(new Set());
    }
  }

  setWorld(world: World) {
    super.setWorld.call(this, world);

    world.on("addBody", ((e: { body: Body }) => this.onAddBody(e.body)) as any);
    world.on("removeBody", ((e: { body: Body }) =>
      this.onRemoveBody(e.body)) as any);
  }

  resize(cellSize: number, width: number, height: number) {
    this.cellSize = cellSize;
    const oldBodies = new Set<Body>();
    for (const partition of this.partitions) {
      for (const body of partition) {
        oldBodies.add(body);
      }
    }

    this.partitions = [];
    for (let i = 0; i < width * height; i++) {
      this.partitions.push(new Set());
    }

    for (const body of oldBodies) {
      this.addBodyToHash(body);
    }
  }

  onAddBody(body: Body) {
    if (body.motion === "dynamic") {
      if (hasOnlyParticleShapes(body)) {
        this.pointShapeBodies.add(body);
      } else {
        this.dynamicBodies.add(body);
      }
    } else if (body.motion === "kinematic") {
      this.kinematicBodies.add(body);
    } else {
      // body is static
      this.addBodyToHash(body);
    }
  }

  onRemoveBody(body: Body) {
    if (body.motion === "dynamic") {
      this.dynamicBodies.delete(body);
      this.pointShapeBodies.delete(body);
    } else if (body.motion === "kinematic") {
      this.kinematicBodies.delete(body);
    } else {
      // body is static
      this.removeBodyFromHash(body);
    }
  }

  addBodyToHash(body: Body) {
    const cells = this.aabbToCells(body.getAABB());
    if (cells === HUGE) {
      this.hugeBodies.add(body);
    } else {
      for (const cell of cells) {
        this.partitions[cell].add(body);
      }
    }
  }

  addBodiesToHash(bodies: Iterable<Body>) {
    for (const body of bodies) {
      this.addBodyToHash(body);
    }
  }

  removeBodyFromHash(body: Body) {
    const cells = this.aabbToCells(body.getAABB());
    if (cells === HUGE) {
      this.hugeBodies.delete(body);
    } else {
      for (const cell of cells) {
        this.partitions[cell].delete(body);
      }
    }
  }

  removeBodiesFromHash(bodies: Iterable<Body>) {
    for (const body of bodies) {
      this.removeBodyFromHash(body);
    }
  }

  addExtraBodies() {
    for (const kBody of this.kinematicBodies) {
      this.addBodyToHash(kBody);
    }
    for (const dBody of this.dynamicBodies) {
      this.addBodyToHash(dBody);
    }
    for (const pBody of this.pointShapeBodies) {
      this.addBodyToHash(pBody);
    }
  }

  removeExtraBodies() {
    for (const kBody of this.kinematicBodies) {
      this.removeBodyFromHash(kBody);
    }
    for (const dBody of this.dynamicBodies) {
      this.removeBodyFromHash(dBody);
    }
    for (const pBody of this.pointShapeBodies) {
      this.removeBodyFromHash(pBody);
    }
  }

  getCollisionPairs(world: World): [Body, Body][] {
    const result: [Body, Body][] = [];

    // Static bodies are already there, we never remove them
    this.addBodiesToHash(this.kinematicBodies);
    this.addBodiesToHash(this.dynamicBodies);
    // Don't add particles because they can't collide with each other, so we just need to check if they're overlapping anything

    for (const pBody of this.pointShapeBodies) {
      for (const other of this.aabbQuery(world, pBody.getAABB(), false)) {
        if (bodiesCanCollide(pBody, other)) {
          result.push([pBody, other]);
        }
      }
    }

    // For the rest of collisions, at least one of the bodies must be dynamic,
    // so we can find all collisions by iterating through just the dynamic bodies
    for (const dBody of this.dynamicBodies) {
      this.removeBodyFromHash(dBody); // This will make sure we don't overlap ourselves, and that we don't double count anything

      for (const other of this.aabbQuery(world, dBody.getAABB(), false)) {
        if (bodiesCanCollide(dBody, other)) {
          result.push([dBody, other]);
        }
      }
    }

    this.removeBodiesFromHash(this.kinematicBodies);

    this.debugData.numCollisions = result.length;

    return result;
  }

  xyToCell(x: number, y: number) {
    return mod(x, this.width) + mod(y, this.height) * this.width;
  }

  /** Returns the cells that overlap the aabb. Returns HUGE if the aabb is "huge". */
  aabbToCells(aabb: AABB, checkHuge = true): number[] {
    const result: number[] = [];

    const lowX = Math.floor(aabb.lowerBound[0] / this.cellSize);
    const lowY = Math.floor(aabb.lowerBound[1] / this.cellSize);
    const highX = Math.floor(aabb.upperBound[0] / this.cellSize);
    const highY = Math.floor(aabb.upperBound[1] / this.cellSize);
    const size = Math.abs(highX - lowX) * Math.abs(highY - lowY);

    // Check for huge
    if (
      checkHuge &&
      (!isFinite(lowX) ||
        !isFinite(lowY) ||
        !isFinite(highX) ||
        !isFinite(highY) ||
        size > HUGE_LIMIT)
    ) {
      return HUGE;
    }

    for (let x = lowX; x <= highX; x++) {
      for (let y = lowY; y <= highY; y++) {
        result.push(this.xyToCell(x, y));
      }
    }

    return result;
  }

  aabbQuery(
    _: World,
    aabb: AABB,
    shouldAddBodies: boolean = true,
  ): Iterable<Body> {
    if (shouldAddBodies) {
      this.addExtraBodies();
    }

    // Use Set for O(1) deduplication - return directly without array conversion
    const resultSet = new Set<Body>();

    for (const cell of this.aabbToCells(aabb, false)) {
      for (const body of this.partitions[cell]) {
        if (body.getAABB().overlaps(aabb)) {
          resultSet.add(body);
        }
      }
    }

    for (const hugeBody of this.hugeBodies) {
      if (aabb.overlaps(hugeBody.getAABB())) {
        resultSet.add(hugeBody);
      }
    }

    if (shouldAddBodies) {
      this.removeExtraBodies();
    }

    return resultSet;
  }

  /** Query all bodies whose cells intersect the ray using DDA grid traversal. */
  rayQuery(ray: RayLike, shouldAddBodies = true): Iterable<Body> {
    if (shouldAddBodies) {
      this.addExtraBodies();
    }

    const resultSet = new Set<Body>();

    const x1 = ray.from[0] / this.cellSize;
    const y1 = ray.from[1] / this.cellSize;
    const x2 = ray.to[0] / this.cellSize;
    const y2 = ray.to[1] / this.cellSize;

    let cellX = Math.floor(x1);
    let cellY = Math.floor(y1);
    const endCellX = Math.floor(x2);
    const endCellY = Math.floor(y2);

    const dx = x2 - x1;
    const dy = y2 - y1;

    const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;

    // How far along the ray (in t) we move when crossing one cell
    const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Infinity;

    // t value at which we cross the first cell boundary
    let tMaxX =
      stepX > 0
        ? (Math.ceil(x1) - x1) * tDeltaX
        : stepX < 0
          ? (x1 - Math.floor(x1)) * tDeltaX
          : Infinity;
    let tMaxY =
      stepY > 0
        ? (Math.ceil(y1) - y1) * tDeltaY
        : stepY < 0
          ? (y1 - Math.floor(y1)) * tDeltaY
          : Infinity;

    const addCell = (cx: number, cy: number) => {
      const cell = this.xyToCell(cx, cy);
      for (const body of this.partitions[cell]) {
        resultSet.add(body);
      }
    };

    // Check starting cell
    addCell(cellX, cellY);

    // Traverse until we reach the end cell
    while (cellX !== endCellX || cellY !== endCellY) {
      if (tMaxX < tMaxY) {
        tMaxX += tDeltaX;
        cellX += stepX;
      } else {
        tMaxY += tDeltaY;
        cellY += stepY;
      }
      addCell(cellX, cellY);
    }

    // Check huge bodies (which aren't in the spatial hash)
    for (const hugeBody of this.hugeBodies) {
      resultSet.add(hugeBody);
    }

    if (shouldAddBodies) {
      this.removeExtraBodies();
    }

    return resultSet;
  }
}

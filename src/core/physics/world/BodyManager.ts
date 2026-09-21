import { FilterMultiMap } from "../../util/FilterListMap";
import { Body } from "../body/Body";
import type { World } from "./World";

const isDynamic = (b: Body): b is Body => b.motion === "dynamic";
const isKinematic = (b: Body): b is Body => b.motion === "kinematic";
const isStatic = (b: Body): b is Body => b.motion === "static";
const isAwakeDynamic = (b: Body): b is Body =>
  b.motion === "dynamic" && !b.isSleeping();

/** Manages bodies in the physics world with type-specific sets and deferred removal. */
export class BodyManager implements Iterable<Body> {
  /** All bodies in the collection. Exposed for direct array access. */
  readonly all = new Set<Body>();
  /** Keeps filtered lists for optimized iteration */
  private filtered = new FilterMultiMap<Body>();
  /** Map of all bodies indexed by their id. */
  private allById = new Map<number, Body>();

  private pendingRemoval: Body[] = [];
  private world: World;

  constructor(world: World) {
    this.world = world;
    this.filtered.addFilter(isDynamic);
    this.filtered.addFilter(isKinematic);
    this.filtered.addFilter(isStatic);
    this.filtered.addFilter(isAwakeDynamic);

    this.world.on("postStep", () => this.endStep());
  }

  /** Set of dynamic bodies for optimized iteration. */
  get dynamic() {
    return this.filtered.getItems(isDynamic)!;
  }
  /** Set of kinematic bodies for optimized iteration. */
  get kinematic() {
    return this.filtered.getItems(isKinematic)!;
  }
  /** Set of static bodies for optimized iteration. */
  get static() {
    return this.filtered.getItems(isStatic)!;
  }
  /** Set of awake dynamic bodies for optimized simulation loops. */
  get dynamicAwake() {
    return this.filtered.getItems(isAwakeDynamic)!;
  }

  /** Update dynamicAwake filter membership when a body's sleep state changes. */
  onSleepStateChanged(body: Body) {
    this.dynamicAwake.addIfValid(body);
  }

  /** Add a body to the world. */
  add(body: Body): void {
    if (this.all.has(body)) {
      throw new Error("Body is already added to the world");
    }
    if (this.allById.has(body.id)) {
      throw new Error(`Body with id ${body.id} already exists in the world`);
    }
    this.all.add(body);
    this.filtered.addItem(body);
    this.allById.set(body.id, body);
    body.world = this.world;
    this.world.emit({ type: "addBody", body });
  }

  /** Remove a body from the world. Defers removal if stepping. */
  remove(body: Body): void {
    if (this.world.stepping) {
      this.pendingRemoval.push(body);
    } else {
      this.removeImmediate(body);
    }
  }

  private removeImmediate(body: Body): void {
    if (!this.all.has(body)) {
      return;
    }
    body.world = null;
    this.all.delete(body);
    this.filtered.removeItem(body);
    this.allById.delete(body.id);
    this.world.emit({ type: "removeBody", body });
  }

  /** Get a body by its id. */
  getById(id: number): Body | undefined {
    return this.allById.get(id);
  }

  /** Call at the end of a physics step to process deferred removals. */
  endStep(): void {
    for (const body of this.pendingRemoval) {
      this.removeImmediate(body);
    }
    this.pendingRemoval = [];
  }

  /** Remove all bodies from the world. */
  clear(): void {
    this.all.clear();
    this.allById.clear();
    this.filtered = new FilterMultiMap<Body>();
    this.pendingRemoval = [];
  }

  /** Number of bodies in the collection. */
  get length(): number {
    return this.all.size;
  }

  [Symbol.iterator](): Iterator<Body> {
    return this.all[Symbol.iterator]();
  }
}

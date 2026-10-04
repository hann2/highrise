/**
 * Tests for bloody footprints: what's spilled on the floor (`SpillGrid`) and
 * what shoes pick up and leave (`Shoes`). Plain node: `npm run test:footprints`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { FootLanding } from "../../src/core/animation/Gait";
import { V } from "../../src/core/Vector";
import {
  OTHER_SHOE,
  PRINTS,
  Shoes,
  StainedFloor,
} from "../../src/highrise/creature-stuff/Shoes";
import type { Stamp } from "../../src/highrise/effects/FloorStains";
import { SpillGrid } from "../../src/highrise/effects/SpillGrid";

const RED = 0x8a0a0a;

test("a spill covers its circle, and nothing outside it", () => {
  const grid = new SpillGrid();
  grid.spill([10, 10], 0.6, RED, 1, Infinity, 0);
  assert.ok(grid.spillAt([10, 10], 0));
  assert.ok(grid.spillAt([10.4, 10], 0));
  assert.ok(grid.spillAt([10, 9.6], 0));
  assert.equal(grid.spillAt([10.9, 10], 0), undefined);
  assert.equal(grid.spillAt([10, 11], 0), undefined);
  // Negative coordinates are fine too
  grid.spill([-3, -3], 0.4, RED, 1, Infinity, 0);
  assert.ok(grid.spillAt([-3, -3], 0));
});

test("a spill that fades is gone when it's faded, and overlaps keep the most", () => {
  const grid = new SpillGrid();
  grid.spill([0, 0], 0.5, RED, 0.5, 10, 0);
  assert.equal(grid.spillAt([0, 0], 5)?.amount, 0.5);
  grid.spill([0, 0], 0.5, RED, 1, 20, 5);
  assert.equal(grid.spillAt([0, 0], 15)?.amount, 1);
  assert.equal(grid.spillAt([0, 0], 20), undefined);
  // A fresh spill where one has dried replaces it
  grid.spill([0, 0], 0.5, RED, 0.4, 30, 25);
  assert.equal(grid.spillAt([0, 0], 26)?.amount, 0.4);
});

/** A floor with a puddle at x 0 to 1, and the prints left on it */
function floorWithPuddle() {
  const grid = new SpillGrid();
  grid.spill([0.5, 0], 0.6, RED, 1, Infinity, 0);
  const stamps: Stamp[] = [];
  const floor: StainedFloor = {
    spillAt: (position) => grid.spillAt(position, 0),
    stamp: (stamp) => stamps.push(stamp),
  };
  return { floor, stamps };
}

const landing = (side: 0 | 1, x: number, y = 0): FootLanding => ({
  side,
  position: V(x, y),
  angle: 0,
  speed: 3,
  settling: false,
});

test("stepping in blood soaks the shoe, which prints fainter and fainter until it's clean", () => {
  const { floor, stamps } = floorWithPuddle();
  const shoes = new Shoes(1);
  shoes.land(landing(0, 0.4), floor, () => floor);
  assert.equal(stamps.length, 0, "no print in the puddle");
  assert.deepEqual(shoes.wetness, [1, OTHER_SHOE]);

  // Walking on, left foot only: it leaves PRINTS prints, each fainter, then none
  for (let i = 0; i < PRINTS + 5; i++) {
    shoes.land(landing(0, 2 + i), floor, () => floor);
  }
  assert.equal(stamps.length, PRINTS);
  for (let i = 1; i < stamps.length; i++) {
    assert.ok(stamps[i].alpha < stamps[i - 1].alpha);
  }
  assert.equal(shoes.wetness[0], 0);
  assert.ok(stamps.every((stamp) => stamp.color === RED && stamp.mirror));
});

test("the other shoe gets some too, and prints its own side", () => {
  const { floor, stamps } = floorWithPuddle();
  const shoes = new Shoes(1);
  shoes.land(landing(1, 0.6), floor, () => floor);
  shoes.land(landing(0, 1.6), floor, () => floor);
  shoes.land(landing(1, 2.6), floor, () => floor);
  assert.equal(stamps.length, 2);
  assert.equal(stamps[0].mirror, true, "the left shoe's print is mirrored");
  assert.equal(stamps[1].mirror, false);
  assert.ok(stamps[0].alpha < stamps[1].alpha, "the left got less");
});

test("clean shoes on a clean floor don't make the floor", () => {
  const shoes = new Shoes(1);
  let made = 0;
  shoes.land(landing(0, 5), undefined, () => {
    made++;
    return floorWithPuddle().floor;
  });
  assert.equal(made, 0);
});

// The guns drawn by generators (bin/gun-art/guns/): each committed file (a pickup, a top view) is what its
// generator draws, so the SVGs aren't edited by hand and drift from their source; and the geometry they share.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { GUNS } from "../../bin/gun-art/guns";
import { arc, fixed, on, smoothCurve } from "../../bin/gun-art/lib/geometry";
import { generatedFiles } from "../../bin/gun-art/lib/gun";
import { GUNS as GUN_STATS } from "../../src/highrise/weapons/guns/gun-stats/gunStats";
import { apply, homography } from "../../bin/gun-art/lib/homography";

for (const gun of GUNS) {
  for (const { file, svg } of generatedFiles(gun)) {
    const name = path.relative(process.cwd(), file);
    test(`${name} is what its generator draws`, () => {
      assert.ok(
        fs.existsSync(file),
        `${name} is missing: run npx tsx bin/gun-art/cli.ts build ${gun.name}`,
      );
      assert.equal(
        fs.readFileSync(file, "utf8"),
        svg,
        `${name} isn't what bin/gun-art/guns/${gun.name}.ts draws: change the generator, then run ` +
          `npx tsx bin/gun-art/cli.ts build ${gun.name}`,
      );
    });
  }
}

// A drawn gun is the same size on the floor as in hand: its pickup's square (in millimeters) is the size
// WeaponPickup stretches it to, and its top view (drawn 1:1) is its art
for (const drawing of GUNS) {
  const pickup =
    drawing.name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase()) +
    "Pickup";
  const stats = GUN_STATS.find((s) => s.textures.pickup === pickup);
  test(`${drawing.name} lies on the floor at the scale it's held at`, () => {
    assert.ok(stats, `no gun's textures.pickup is "${pickup}"`);
    const side = drawing.frame.side / 1000;
    assert.deepEqual(
      stats.size,
      [side, side],
      `${stats.name}'s size should be [${side}, ${side}], its pickup's square in meters`,
    );
    if (drawing.top) {
      assert.equal(
        stats.art,
        drawing.name,
        `${stats.name}'s art should be its top view, "${drawing.name}"`,
      );
    }
  });
}

test("a homography takes its four points where they go, and is a projective map between", () => {
  const from: [number, number][] = [
    [0, 0],
    [100, 0],
    [100, 50],
    [0, 50],
  ];
  const to: [number, number][] = [
    [10, 10],
    [210, 20],
    [205, 120],
    [5, 110],
  ];
  const h = homography(from, to);
  from.forEach((p, i) => {
    const [x, y] = apply(h, p);
    assert.ok(Math.abs(x - to[i][0]) < 1e-6 && Math.abs(y - to[i][1]) < 1e-6);
  });
});

test("numbers round exact ties to even, as the first (Python) generators did", () => {
  assert.equal(fixed(0.25, 1), "0.2");
  assert.equal(fixed(0.75, 1), "0.8");
  assert.equal(fixed(-0.25, 1), "-0.2");
  assert.equal(fixed(2.5, 0), "2");
  assert.equal(fixed(1.26, 1), "1.3");
});

test("an arc ends where it should, on its circle", () => {
  const path = arc([10, 20], 5, -90, 90);
  const last = path.trim().split(" ").at(-1)!.split(",").map(Number);
  const end = on([10, 20], 5, 90);
  assert.ok(
    Math.abs(last[0] - end[0]) < 0.06 && Math.abs(last[1] - end[1]) < 0.06,
  );
  assert.equal(path.match(/C/g)?.length, 2); // a half circle is two quarters
});

test("a smooth curve goes through every point", () => {
  const points: [number, number][] = [
    [0, 0],
    [10, 5],
    [20, 0],
    [30, -5],
  ];
  const path = smoothCurve(points, [1, 0], [1, 0]);
  const ends = path
    .split("C")
    .slice(1)
    .map((piece) => piece.trim().split(" ").at(-1)!.split(",").map(Number));
  assert.deepEqual(ends, points.slice(1));
});

/**
 * Tests for things that hang and bend (`src/core/animation/DangleChain.ts`
 * and `src/highrise/creature-stuff/chainStrip.ts`): left alone the chain
 * hangs straight; setting off, the end lags further behind than the root,
 * so it curves; it comes out the same whatever the frame rate; and its
 * strip is straight along a straight chain, keeps its width round a bent
 * one, and goes straight on behind the pivot. Plain node: `npm run test:core`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DangleStyle } from "../../src/core/animation/Dangle";
import { DangleChain } from "../../src/core/animation/DangleChain";
import {
  chainColumns,
  chainStrip,
} from "../../src/highrise/creature-stuff/chainStrip";

const STYLE: DangleStyle = {
  frequency: 1.6,
  dampingRatio: 0.22,
  drag: 1.5,
  maxAngle: 0.9,
  minStretch: 0.6,
  maxStretch: 1.45,
};

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} isn't ${b}`);

test("left alone, it hangs straight", () => {
  const chain = new DangleChain(STYLE, 0.3, 3, 0.5);
  for (let t = 0; t < 2; t += 1 / 60) {
    chain.update(0, 0, Math.PI, 1 / 60);
  }
  for (const link of chain.links) {
    close(link.angle, 0);
    close(link.stretch, 1);
  }
  // Its tip is the whole length straight back
  const tip = chain.links[2];
  close(tip.tipX, -0.3);
  close(tip.tipY, 0);
});

test("turning, the end lags behind the root, so it curves", () => {
  const chain = new DangleChain(STYLE, 0.3, 3, 0.5);
  let angle = Math.PI;
  chain.update(0, 0, angle, 1 / 60);
  for (let t = 0; t < 0.3; t += 1 / 60) {
    angle += 3 / 60;
    chain.update(0, 0, angle, 1 / 60);
  }
  // Each link's left behind the way the one before it points, the same way
  const [root, middle, end] = chain.links.map((link) => link.angle);
  assert.ok(root < 0, `root ${root}`);
  assert.ok(middle < 0 && end < 0, `${middle}, ${end}`);
  // and each bends at most `bend` from the one before
  assert.ok(Math.abs(middle) <= 0.5 + 1e-9 && Math.abs(end) <= 0.5 + 1e-9);
});

test("it comes out about the same at 60 and 144 fps", () => {
  const run = (fps: number) => {
    const chain = new DangleChain(STYLE, 0.3, 3, 0.5);
    let x = 0;
    for (let t = 0; t < 1.5; t += 1 / fps) {
      if (t < 1) {
        x += 3 / fps;
      }
      chain.update(x, 0, Math.PI, 1 / fps);
    }
    return chain.links.map((link) => link.angle);
  };
  const a = run(60);
  const b = run(144);
  a.forEach((angle, i) => close(angle, b[i], 0.03));
});

const PICTURE = { from: -0.05, to: 0.32, top: -0.03, bottom: 0.03 };

function strip(joints: number[]) {
  const along = chainColumns(PICTURE);
  return chainStrip(
    PICTURE,
    0.3,
    Float64Array.from(joints),
    along,
    new Float32Array(along.length * 4),
  );
}

test("along a straight chain, the strip is the picture, straight", () => {
  const out = strip([0, 0, 0.1, 0, 0.2, 0, 0.3, 0]);
  const along = chainColumns(PICTURE);
  for (let c = 0; c < along.length; c++) {
    close(out[c * 4], along[c]);
    close(out[c * 4 + 1], -0.03);
    close(out[c * 4 + 2], along[c]);
    close(out[c * 4 + 3], 0.03);
  }
});

test("round a bent chain, it keeps its width, and goes straight on behind the pivot", () => {
  // Straight back along +x, then turning a right angle
  const out = strip([0, 0, 0.1, 0, 0.17, 0.07, 0.17, 0.17]);
  const columns = out.length / 4;
  for (let c = 0; c < columns; c++) {
    const width = Math.hypot(
      out[c * 4] - out[c * 4 + 2],
      out[c * 4 + 1] - out[c * 4 + 3],
    );
    close(width, 0.06);
  }
  // Behind the pivot it's along the first link's way
  close(out[0], -0.05);
  close(out[1], -0.03);
  // and the end's gone round to +y
  const last = columns - 1;
  assert.ok(out[last * 4 + 1] > 0.15, `${out[last * 4 + 1]}`);
});

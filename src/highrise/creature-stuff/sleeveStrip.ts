/**
 * A sleeve bent at the elbow: its straight picture laid along a bent arm as
 * a strip of triangles, so whatever's on it (a hem, stripes, a cuff) goes
 * on round the elbow unbroken, the way a sleeve does, where the arm itself
 * is drawn in two halves.
 *
 * The picture runs along +x from the shoulder joint, in meters for the
 * unbent arm. Each column of the strip is a line across the picture: along
 * the upper arm until the elbow and along the forearm after it, each part
 * shortened as much as it's foreshortened, as the arm's halves are. Across
 * the elbow the columns turn from square to the upper arm to square to the
 * forearm, so the outside of the bend comes round full width and the inside
 * bunches up, folding over itself in a sharp bend, as cloth does.
 *
 * Positions are 2D in the body's own frame; lengths in the same units.
 */

/**
 * How far along the arm either side of the elbow a sleeve turns from the
 * upper arm's way to the forearm's, in arm thicknesses
 */
export const SLEEVE_BEND = 0.5;

/**
 * How many columns a strip that bends has: 2 vertices each. Every vertex
 * costs a little every frame (Pixi copies them into its batch), and a few
 * dozen are plenty, closer together round the elbow (`BEND_DENSITY`)
 */
export const SLEEVE_COLUMNS = 24;

export interface SleevePicture {
  /** Where its left and right edges are along the unbent arm, from the shoulder joint */
  from: number;
  to: number;
  /** Where its top and bottom edges are across the arm, from its middle line */
  top: number;
  bottom: number;
}

export interface ArmPose {
  shoulder: readonly [number, number];
  elbow: readonly [number, number];
  hand: readonly [number, number];
  /** The unbent lengths from shoulder to elbow and elbow to hand */
  upperArm: number;
  forearm: number;
  /** How far along the unbent arm either side of the elbow the columns turn */
  bend: number;
}

/** The strip's triangles, in the order of its vertices (2 a column) */
export function sleeveIndices(columns = SLEEVE_COLUMNS): Uint32Array {
  const indices = new Uint32Array((columns - 1) * 6);
  for (let i = 0; i < columns - 1; i++) {
    const v = i * 2;
    indices.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], i * 6);
  }
  return indices;
}

/**
 * How many times closer together the columns are round the elbow than
 * elsewhere: where the strip turns, each pair of triangles between two
 * columns maps the picture onto a wedge, slightly differently each, so an
 * edge on the picture zigzags; the less each turns, the less it does
 */
const BEND_DENSITY = 4;

/**
 * How many columns a sleeve needs: one that ends before the elbow never
 * bends, so it's a single quad, as cheap as a sprite
 */
export function sleeveColumnCount(
  picture: SleevePicture,
  upperArm: number,
  bend: number,
): number {
  return picture.to <= upperArm - bend ? 2 : SLEEVE_COLUMNS;
}

/**
 * Where along the unbent arm each column is: from one end of the picture to
 * the other, closer together round the elbow (`BEND_DENSITY`)
 */
export function sleeveColumns(
  picture: SleevePicture,
  upperArm: number,
  bend: number,
  columns = SLEEVE_COLUMNS,
): Float64Array {
  const { from, to } = picture;
  // How much of the picture there is up to `x`, counting the bend more
  const lo = upperArm - bend;
  const hi = upperArm + bend;
  const weight = (x: number) =>
    x -
    from +
    (BEND_DENSITY - 1) * Math.max(0, Math.min(x, hi) - Math.max(lo, from));
  const total = weight(to);
  const along = new Float64Array(columns);
  for (let i = 0; i < columns; i++) {
    // Where the weight's this far along, by halving
    const target = (total * i) / (columns - 1);
    let a = from;
    let b = to;
    for (let j = 0; j < 40; j++) {
      const m = (a + b) / 2;
      if (weight(m) < target) {
        a = m;
      } else {
        b = m;
      }
    }
    along[i] = (a + b) / 2;
  }
  along[0] = from;
  along[columns - 1] = to;
  return along;
}

/**
 * The texture coordinates of each vertex: each column's top and then its
 * bottom, at its place along the picture (`sleeveColumns`)
 */
export function sleeveUvs(
  picture: SleevePicture,
  along: Float64Array,
): Float32Array {
  const uvs = new Float32Array(along.length * 4);
  for (let i = 0; i < along.length; i++) {
    const u = (along[i] - picture.from) / (picture.to - picture.from);
    uvs.set([u, 0, u, 1], i * 4);
  }
  return uvs;
}

/**
 * Where each vertex of the strip goes (as `sleeveUvs` orders them), into
 * `out` (4 numbers a column: x, y of each), for columns `along` the arm
 * (`sleeveColumns`)
 */
export function sleeveStrip(
  picture: SleevePicture,
  pose: ArmPose,
  along: Float64Array,
  out: Float32Array,
): Float32Array {
  const { shoulder, elbow, hand, upperArm, forearm, bend } = pose;
  const ux = elbow[0] - shoulder[0];
  const uy = elbow[1] - shoulder[1];
  const fx = hand[0] - elbow[0];
  const fy = hand[1] - elbow[1];
  const upperLength = Math.hypot(ux, uy);
  const foreLength = Math.hypot(fx, fy);
  // Which way each half points; one with no length seen from above (end
  // on) points the way the other does
  const upperAngle =
    upperLength > 1e-9
      ? Math.atan2(uy, ux)
      : foreLength > 1e-9
        ? Math.atan2(fy, fx)
        : 0;
  const foreAngle = foreLength > 1e-9 ? Math.atan2(fy, fx) : upperAngle;
  let turn = foreAngle - upperAngle;
  turn -= Math.round(turn / (2 * Math.PI)) * 2 * Math.PI;
  // The sharper the bend, the more of the sleeve near the elbow bunches up
  // round it, so the outside of the bend is round, not cut in
  const squeeze = Math.abs(Math.sin(turn / 2));
  const upperSquare = [-Math.sin(upperAngle), Math.cos(upperAngle)];
  const foreSquare = [-Math.sin(foreAngle), Math.cos(foreAngle)];
  const { top, bottom } = picture;
  for (let i = 0; i < along.length; i++) {
    const unbent = along[i];
    const fromElbow = unbent - upperArm;
    const near = Math.max(0, 1 - Math.abs(fromElbow) / bend);
    const s = upperArm + fromElbow * (1 - squeeze * near);
    // Where the middle of the column is, each half as long as it looks
    let x: number;
    let y: number;
    if (s <= upperArm) {
      x = shoulder[0] + (ux * s) / upperArm;
      y = shoulder[1] + (uy * s) / upperArm;
    } else {
      x = elbow[0] + (fx * (s - upperArm)) / forearm;
      y = elbow[1] + (fy * (s - upperArm)) / forearm;
    }
    // Which way it's turned, from the upper arm's way to the forearm's
    const t = Math.min(1, Math.max(0, (fromElbow + bend) / (2 * bend)));
    // Square to that, as a sprite turned that way would have its +y
    let px: number;
    let py: number;
    if (t <= 0) {
      [px, py] = upperSquare;
    } else if (t >= 1) {
      [px, py] = foreSquare;
    } else {
      const angle = upperAngle + turn * t * t * (3 - 2 * t);
      px = -Math.sin(angle);
      py = Math.cos(angle);
    }
    out[i * 4] = x + px * top;
    out[i * 4 + 1] = y + py * top;
    out[i * 4 + 2] = x + px * bottom;
    out[i * 4 + 3] = y + py * bottom;
  }
  return out;
}

/**
 * Something that hangs and bends (a ponytail, a tie, a scarf's end): its
 * straight picture laid along a bent chain (`DangleChain`) as a strip of
 * triangles, so it curves rather than swinging stiffly as one.
 *
 * The picture hangs along +x from its pivot at the origin, `length` to its
 * tip; the chain is the joints from the pivot to the tip, each link an equal
 * share of that. Each column of the strip goes along a smooth curve through
 * the joints (Catmull-Rom), square to it, so it bends evenly, not in a kink
 * at each joint; what's behind the pivot or past the tip goes straight on
 * from the ends.
 *
 * The triangles and texture coordinates are a sleeve's (`sleeveIndices`,
 * `sleeveUvs`): each column's top and then its bottom.
 */
import { SleevePicture } from "./sleeveStrip";

/** How many columns along a strip: 2 vertices each */
export const CHAIN_COLUMNS = 14;

/** Where along the picture each column is, evenly from one end to the other */
export function chainColumns(
  picture: SleevePicture,
  columns = CHAIN_COLUMNS,
): Float64Array {
  const along = new Float64Array(columns);
  for (let i = 0; i < columns; i++) {
    along[i] = picture.from + ((picture.to - picture.from) * i) / (columns - 1);
  }
  return along;
}

/**
 * Where each vertex of the strip goes, into `out` (4 numbers a column: x, y
 * of its top and bottom), for columns `along` a picture `length` from pivot
 * to tip, laid along the chain whose joints are `joints` (x, y each, from
 * the pivot to the tip)
 */
export function chainStrip(
  picture: SleevePicture,
  length: number,
  joints: Float64Array,
  along: Float64Array,
  out: Float32Array,
): Float32Array {
  const links = joints.length / 2 - 1;
  const link = length / links;
  const jx = (i: number) => joints[Math.max(0, Math.min(links, i)) * 2];
  const jy = (i: number) => joints[Math.max(0, Math.min(links, i)) * 2 + 1];
  // Past the ends, the joint before the first and after the last carry
  // straight on, so the curve doesn't bend there
  const px = (i: number) =>
    i < 0
      ? 2 * jx(0) - jx(1)
      : i > links
        ? 2 * jx(links) - jx(links - 1)
        : jx(i);
  const py = (i: number) =>
    i < 0
      ? 2 * jy(0) - jy(1)
      : i > links
        ? 2 * jy(links) - jy(links - 1)
        : jy(i);
  const { top, bottom } = picture;
  for (let c = 0; c < along.length; c++) {
    const s = along[c] / link;
    // Which link it's on, and how far along it; outside the chain, how far
    // past its end along the way the end goes
    const k = Math.max(0, Math.min(links - 1, Math.floor(s)));
    const t = Math.max(0, Math.min(1, s - k));
    const beyond = s - k - t;
    const [x0, y0, x1, y1, x2, y2, x3, y3] = [
      px(k - 1),
      py(k - 1),
      px(k),
      py(k),
      px(k + 1),
      py(k + 1),
      px(k + 2),
      py(k + 2),
    ];
    const t2 = t * t;
    const t3 = t2 * t;
    let x =
      0.5 *
      (2 * x1 +
        (x2 - x0) * t +
        (2 * x0 - 5 * x1 + 4 * x2 - x3) * t2 +
        (3 * x1 - x0 - 3 * x2 + x3) * t3);
    let y =
      0.5 *
      (2 * y1 +
        (y2 - y0) * t +
        (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 +
        (3 * y1 - y0 - 3 * y2 + y3) * t3);
    let dx =
      0.5 *
      (x2 -
        x0 +
        2 * (2 * x0 - 5 * x1 + 4 * x2 - x3) * t +
        3 * (3 * x1 - x0 - 3 * x2 + x3) * t2);
    let dy =
      0.5 *
      (y2 -
        y0 +
        2 * (2 * y0 - 5 * y1 + 4 * y2 - y3) * t +
        3 * (3 * y1 - y0 - 3 * y2 + y3) * t2);
    let d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-9) {
      // Seen end on: square to the link, if it has any length, else to +x
      dx = x2 - x1;
      dy = y2 - y1;
      d = Math.sqrt(dx * dx + dy * dy);
      if (d < 1e-9) {
        dx = 1;
        dy = 0;
        d = 1;
      }
    }
    dx /= d;
    dy /= d;
    if (beyond !== 0) {
      // Straight on past the end, as far as that much of its link is drawn
      const span = Math.hypot(x2 - x1, y2 - y1);
      x += dx * beyond * span;
      y += dy * beyond * span;
    }
    // Square to the way it goes, as a sprite turned that way has its +y
    out[c * 4] = x - dy * top;
    out[c * 4 + 1] = y + dx * top;
    out[c * 4 + 2] = x - dy * bottom;
    out[c * 4 + 3] = y + dx * bottom;
  }
  return out;
}

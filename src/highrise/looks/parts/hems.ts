import { HIP_WIDTH } from "../../creature-stuff/Legs";
import { HemShape, ovalAt, Oval } from "../../creature-stuff/hemCloth";
import { BodyLook } from "../BodyLook";
import { Color, darken, lighten } from "../color";
import { BodyDimensions, lookRandom } from "../dimensions";
import { HemDrawing } from "../hems";
import { Drawing, n, polygonPath, Pt, smoothPath } from "../svg";
import { pantsCoverage } from "./legs";
import { drawBlood, drawPattern, drawRips } from "./wear";

/** How long a leg is from the hip to the ankle, standing (mm), for how long cloth hanging down it is */
const LEG_HEIGHT = 850;

/** How far down the legs a coat comes */
const COAT_DROP = 0.4;

/** Half the gap down the front of a coat (radians) */
const COAT_OPENING = 0.2;

/** The cloth hanging from round the waist that `look` wears: a skirt, a coat's tails */
export function drawHems(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
): HemDrawing[] {
  const hems: HemDrawing[] = [];
  if (look.pantsStyle === "skirt") {
    hems.push(drawSkirt(look, dims, `${prefix}-sk`));
  }
  if (look.top.style === "coat") {
    hems.push(drawCoatTails(look, dims, `${prefix}-ct`));
  }
  return hems;
}

/** Round the hips, over the tops of the legs, standing square */
function hipsOval(look: BodyLook, dims: BodyDimensions, out: number): Oval {
  const leg = dims.legThickness / 2;
  return {
    front: leg + 25 + dims.belly * 0.4 + out,
    back: leg + 40 + out,
    side: HIP_WIDTH * 1000 + leg + 8 + out,
  };
}

/** `oval` pushed out by these much in front, behind and at the sides */
function grow(oval: Oval, front: number, back: number, side: number): Oval {
  return {
    front: oval.front + front,
    back: oval.back + back,
    side: oval.side + side,
  };
}

/** Points round `oval` from `from` to `to` radians, each pulled in by `bump(angle)` (mm) */
function ovalPoints(
  oval: Oval,
  from: number,
  to: number,
  count: number,
  bump: (angle: number) => number = () => 0,
): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i <= count; i++) {
    const angle = from + ((to - from) * i) / count;
    const [x, y] = ovalAt(oval, angle);
    const r = Math.hypot(x, y) || 1;
    const k = (r - bump(angle)) / r;
    points.push([x * k, y * k]);
  }
  return points;
}

/** A drawing big enough for `shape` hanging at rest */
function hemDrawing(prefix: string, shape: HemShape): Drawing {
  const outside = grow(shape.hem, shape.margin, shape.margin, shape.margin);
  const d = new Drawing(
    prefix,
    -outside.back,
    -outside.side,
    outside.front,
    outside.side,
  );
  d.include(-outside.back, -outside.side, outside.front, outside.side);
  // Laid over the legs, and swung away from where it's drawn: a shadow
  // would go with it
  d.castsShadow = false;
  return d;
}

/**
 * A skirt from above, hanging at rest: from the waist round the hips out to
 * the hem, which is what shows past the torso, folds and all. Its hem
 * swings (`HemCloth`) and the legs push it out as they stride.
 */
function drawSkirt(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
): HemDrawing {
  const coverage = pantsCoverage(look);
  const cloth = coverage * LEG_HEIGHT;
  const waist = hipsOval(look, dims, 0);
  // How deep the hem's scalloped where the folds hang
  const depth = 6 + cloth * 0.012;
  const shape: HemShape = {
    waist,
    hem: grow(waist, 30 + cloth * 0.16, 30 + cloth * 0.16, 20 + cloth * 0.12),
    margin: 8,
    band: depth + 14,
    cloth,
    drop: coverage,
    opening: 0,
  };
  const d = hemDrawing(prefix, shape);
  const random = lookRandom(look, 11);
  const color = look.pants;
  // The hem, scalloped where the folds hang
  const folds = 9 + Math.floor(random() * 4);
  const phase = random() * Math.PI * 2;
  const hem = smoothPath(
    ovalPoints(shape.hem, 0, Math.PI * 2, 72, (angle) => {
      const wave = Math.sin(angle * folds + phase);
      return depth * (1 - wave) * 0.5;
    }).slice(0, -1),
    true,
  );
  d.blob(hem, color, { shade: "dome" });
  const clip = d.clipPath("skirt", hem);
  drawFolds(d, shape, folds, phase, color, clip);
  // A darker band round the hem, where it's turned up
  d.begin(`clip-path="url(#${clip})"`);
  d.line(hem, darken(color, 0.25), 12, `opacity="0.7"`);
  d.end();
  drawWear(d, look, shape, color, clip, random);
  return { kind: "skirt", layer: "legs", drawing: d, shape };
}

/**
 * A coat's tails from above, hanging at rest from the bottom of the torso:
 * all the way round but a gap down the front, edged with its trim, and a
 * vent up the back
 */
function drawCoatTails(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
): HemDrawing {
  const { top } = look;
  const cloth = COAT_DROP * LEG_HEIGHT;
  const hips = hipsOval(look, dims, 18);
  // Where it comes out from under the torso
  const under: Oval = {
    front: Math.max(hips.front, dims.chestDepth * 0.7 + dims.belly * 0.5),
    back: Math.max(hips.back, dims.backDepth * 0.8),
    side: Math.max(hips.side, dims.shoulderHalfWidth * 0.6),
  };
  // and where it hangs from, well in under the torso, so none of the gap
  // between them shows as the hem swings and the torso turns
  const waist: Oval = {
    front: under.front * 0.5,
    back: under.back * 0.5,
    side: under.side * 0.55,
  };
  const shape: HemShape = {
    waist,
    hem: grow(under, 20 + cloth * 0.05, 40 + cloth * 0.06, 25 + cloth * 0.05),
    margin: 8,
    band: 14,
    cloth,
    drop: COAT_DROP,
    opening: COAT_OPENING,
  };
  const d = hemDrawing(prefix, shape);
  const random = lookRandom(look, 12);
  const from = COAT_OPENING;
  const to = Math.PI * 2 - COAT_OPENING;
  const outer = ovalPoints(shape.hem, from, to, 64);
  const inner = ovalPoints(shape.waist, from, to, 32).reverse();
  const coat =
    smoothPath(outer, false) +
    `L${n(inner[0][0])} ${n(inner[0][1])}` +
    smoothPath(inner, false).replace(/^M[^C]*/, "") +
    "Z";
  d.blob(coat, top.color, { shade: "dome" });
  const clip = d.clipPath("coat", coat);
  if (top.pattern) {
    drawPattern(d, top.pattern, clip);
  }
  drawFolds(d, shape, 7, random() * Math.PI * 2, top.color, clip);
  d.begin(`clip-path="url(#${clip})"`);
  // The vent up the back
  const [vx, vy] = ovalAt(shape.hem, Math.PI);
  const [wx] = ovalAt(shape.waist, Math.PI);
  d.line(`M${n(wx)} ${n(vy)}L${n(vx)} ${n(vy)}`, darken(top.color, 0.4), 6);
  // The trim down each edge of the front, on the inside of the gap
  const trim = 44;
  for (const [edge, inward] of [
    [from, 1],
    [to, -1],
  ]) {
    const at = (oval: Oval, width: number) => {
      const r = Math.hypot(...ovalAt(oval, edge));
      return ovalAt(oval, edge + (inward * width) / r);
    };
    d.blob(
      polygonPath([
        ovalAt(shape.waist, edge),
        ovalAt(shape.hem, edge),
        at(shape.hem, trim),
        at(shape.waist, trim),
      ]),
      top.secondary,
      { shade: "flat", outline: 5 },
    );
  }
  d.line(
    smoothPath(outer, false),
    darken(top.color, 0.25),
    12,
    `opacity="0.6"`,
  );
  d.end();
  drawWear(d, look, shape, top.color, clip, random);
  return { kind: "coat", layer: "torso", drawing: d, shape };
}

/** Folds hanging from the waist to the hem, where the hem's scalloped in */
function drawFolds(
  d: Drawing,
  shape: HemShape,
  folds: number,
  phase: number,
  color: Color,
  clip: string,
) {
  d.begin(`clip-path="url(#${clip})"`);
  for (let i = 0; i < folds; i++) {
    // Where the scallops are deepest: sin(angle * folds + phase) = -1
    const angle = (Math.PI * 1.5 - phase + i * Math.PI * 2) / folds;
    const [wx, wy] = ovalAt(shape.waist, angle);
    const [hx, hy] = ovalAt(shape.hem, angle);
    d.line(
      `M${n(wx)} ${n(wy)}L${n(hx)} ${n(hy)}`,
      darken(color, 0.3),
      7,
      `opacity="0.45"`,
    );
    // and the light on the fold in between
    const between = angle + Math.PI / folds;
    const [bx, by] = ovalAt(shape.waist, between);
    const [cx, cy] = ovalAt(shape.hem, between);
    d.line(
      `M${n(bx)} ${n(by)}L${n(cx)} ${n(cy)}`,
      lighten(color, 0.25),
      6,
      `opacity="0.3"`,
    );
  }
  d.end();
}

/** A zombie's rips and blood, between the waist and the hem */
function drawWear(
  d: Drawing,
  look: BodyLook,
  shape: HemShape,
  color: Color,
  clip: string,
  random: () => number,
) {
  const at = (): Pt => {
    const angle = random() * Math.PI * 2;
    const t = 0.3 + random() * 0.6;
    const [wx, wy] = ovalAt(shape.waist, angle);
    const [hx, hy] = ovalAt(shape.hem, angle);
    return [wx + (hx - wx) * t, wy + (hy - wy) * t];
  };
  // Torn through to the shadow under it
  drawRips(d, look, darken(color, 0.65), color, clip, at, random, 0.6);
  drawBlood(d, look, clip, at, random, 0.6);
}

import { BodyLook, Hat } from "../BodyLook";
import { Color, darken, lighten, mix } from "../color";
import { BodyDimensions, lookRandom, palette, wobble } from "../dimensions";
import {
  Drawing,
  ellipsePath,
  ellipsePoints,
  n,
  polygonPath,
  Pt,
  smoothPath,
} from "../svg";
import { STYLE } from "../style";
import {
  drawHatDrawing,
  drawPiece,
  hasHatDrawing,
  piecePlace,
} from "../pieces";

/**
 * The head from above, facing +x, the skull's middle at the origin: hair,
 * ears, nose, brows, a beard, glasses and a hat.
 */
export function drawHead(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
): Drawing {
  const { headRx: rx, headRy: ry } = dims;
  const colors = palette(look);
  const rot = look.zombie?.rot ?? 0;
  const skinGrain = rot > 0 ? "rot" : undefined;
  const hair = look.hair;
  const random = lookRandom(look, 1);
  const d = new Drawing(prefix, -rx, -ry, rx, ry);
  d.include(-rx * 1.1, -ry * 1.15, rx * 1.1, ry * 1.15);

  // Hair down the back, under everything
  const grown = hair.coverage > 0 && !hair.cut;
  if (hair.length > 0.02 && grown) {
    drawLongHair(d, look, rx, ry, colors.hair, random);
  }
  if (hair.ponytail > 0.02 && grown) {
    drawPonytail(d, hair.ponytail, rx, ry, colors.hair, random);
  }

  // Ears, a nose, a beard: whatever sticks out from under the skull
  for (const side of [-1, 1]) {
    d.blob(ellipsePath(-rx * 0.06, side * ry * 0.97, 24, 31), colors.skin, {
      grain: skinGrain,
    });
  }
  if (look.beard && look.beard.length > 0) {
    drawBeard(d, look, rx, ry, random);
  }
  d.blob(ellipsePath(rx * 0.95, 0, 27, 20), colors.skin, { grain: skinGrain });
  d.include(rx * 0.95 + 27, -20, rx * 0.95 + 27, 20);

  const skull = smoothPath(skullPoints(rx, ry, 48));
  d.blob(skull, colors.skin, { grain: skinGrain });

  // Eyes and brows at the front edge, unless the hair hides them
  drawEyes(d, rx, ry, colors.skin, rot);
  drawBrows(d, look, rx, ry, colors.hair);

  if (hair.coverage > 0 && hair.cut) {
    drawCropped(d, look, rx, ry, colors.hair, colors.skin);
  } else if (hair.coverage > 0) {
    drawHair(d, look, rx, ry, colors.hair, colors.skin, random);
  }
  if (look.glasses) {
    drawGlasses(d, look.glasses.shape, look.glasses.color, rx, ry);
  }
  if (look.hat) {
    // Big enough to cover the hair's edge at its furthest
    const hairOut =
      hair.coverage > 0 && !hair.cut
        ? 0.035 + hair.volume * 0.2 + hair.curls * 0.19 + hair.messiness * 0.07
        : 0;
    drawHat(d, look.hat, rx, ry, 1 + hairOut);
  }
  for (const piece of look.pieces ?? []) {
    if (piecePlace(piece.name) === "head") {
      drawPiece(d, piece.name, piece.color, piece.secondary);
    }
  }
  return d;
}

/** Which eyes `drawEyes` draws: being compared */
export const EYES: { style: "dots" | "almond" | "lids" | "sockets" } = {
  style: "almond",
};

/**
 * The eyes, at the front edge of the head: from above only a sliver of
 * each shows, under the brow
 */
function drawEyes(
  d: Drawing,
  rx: number,
  ry: number,
  skin: Color,
  rot: number,
) {
  const dead = rot > 0.5;
  for (const side of [-1, 1]) {
    const y = side * ry * 0.3;
    // Just inside the skull's front edge there
    const e = STYLE.headSquare;
    const x = rx * (1 - Math.abs(y / ry) ** e) ** (1 / e) - 9;
    const at = `transform="rotate(${side * 14} ${n(x)} ${n(y)})"`;
    switch (EYES.style) {
      case "dots":
        d.add(
          `<ellipse cx="${n(x)}" cy="${n(y)}" rx="9" ry="14" fill="${dead ? "#c9c7a0" : "#2a2420"}" ${at}/>`,
        );
        break;
      case "almond": {
        // The white, the iris toward the front, and the lid behind
        const white = dead ? "#c9c7a0" : mix("#f4f1ea", skin, 0.12);
        d.add(
          `<g ${at}><path d="M${n(x - 12)} ${n(y - 20)}Q${n(x + 14)} ${n(y)} ${n(x - 12)} ${n(y + 20)}Q${n(x - 18)} ${n(y)} ${n(x - 12)} ${n(y - 20)}Z" fill="${white}"/>` +
            (dead
              ? ""
              : `<ellipse cx="${n(x - 2)}" cy="${n(y)}" rx="6" ry="9" fill="#2a2420"/>`) +
            `<path d="M${n(x - 12)} ${n(y - 21)}Q${n(x - 19)} ${n(y)} ${n(x - 12)} ${n(y + 21)}" fill="none" stroke="${darken(skin, 0.45)}" stroke-width="4" stroke-linecap="round"/></g>`,
        );
        break;
      }
      case "lids":
        // Just the line of the upper lid and lashes
        d.add(
          `<path d="M${n(x - 4)} ${n(y - 17)}Q${n(x + 7)} ${n(y)} ${n(x - 4)} ${n(y + 17)}" fill="none" stroke="${dead ? "#8a8770" : "#2a2420"}" stroke-width="5" stroke-linecap="round" ${at}/>`,
        );
        break;
      case "sockets":
        // A soft hollow, with the eye glinting in it
        d.add(
          `<ellipse cx="${n(x - 5)}" cy="${n(y)}" rx="14" ry="22" fill="${darken(skin, 0.18)}" opacity="0.7" ${at}/>` +
            `<ellipse cx="${n(x)}" cy="${n(y)}" rx="6" ry="9" fill="${dead ? "#c9c7a0" : "#2a2420"}" ${at}/>` +
            `<circle cx="${n(x + 2)}" cy="${n(y - side * 3)}" r="2" fill="#fff" opacity="0.7"/>`,
        );
        break;
    }
  }
}

/** Eases from 0 below `a` to 1 above `b` */
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** A bump of 1 at `at`, falling off over about `width` either side */
function bell(x: number, at: number, width: number): number {
  return Math.exp(-(((x - at) / width) ** 2));
}

/**
 * Where the hairline is (x, mm) across the head at `y`: how far forward the
 * hair comes there, by its coverage, fringe and shape (`Hairline`)
 */
function hairlineAt(look: BodyLook, rx: number, ry: number, y: number) {
  const hair = look.hair;
  const base = rx * (-1.2 + 2.1 * hair.coverage);
  const u = y / ry;
  const a = Math.abs(u);
  const t = Math.min(1, u * u);
  const fringe = hair.fringe * 0.42 * (t - 0.35);
  // Forward to the sideburns at the sides, by the ears
  const sideburns = 0.05 * smoothstep(0.9, 1.2, a);
  let shape: number;
  switch (hair.hairline) {
    case "natural":
      shape = 0.1 * (1 - t) - 0.09 * bell(a, 0.72, 0.16) + sideburns;
      break;
    case "straight":
      shape = 0.1 - 0.32 * smoothstep(0.8, 1.3, a);
      break;
    case "peak":
      shape =
        0.03 +
        0.16 * Math.max(0, 1 - a / 0.3) ** 1.5 -
        0.1 * bell(a, 0.7, 0.18) +
        sideburns;
      break;
    case "receding":
      shape = 0.06 * (1 - t) - 0.28 * bell(a, 0.62, 0.22) + sideburns;
      break;
    case "swept": {
      // Far forward on one side, back on the other
      const side = (hair.part ?? -1) < 0 ? -1 : 1;
      shape =
        0.06 +
        0.13 * Math.max(-1, Math.min(1, side * u)) -
        0.2 * smoothstep(0.9, 1.3, a);
      break;
    }
    case "curtains":
      shape =
        0.08 * (1 - t) -
        0.16 * Math.max(0, 1 - a / 0.25) +
        0.06 * bell(a, 0.5, 0.2) +
        sideburns;
      break;
  }
  return base + (shape + fringe) * rx;
}

/** The region behind the hairline, as a path, `forward` mm further forward */
function hairlinePath(look: BodyLook, rx: number, ry: number, forward = 0) {
  const points: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const y = -ry * 1.6 + (ry * 3.2 * i) / 40;
    points.push([hairlineAt(look, rx, ry, y) + forward, y]);
  }
  points.push([-rx * 3, ry * 1.6], [-rx * 3, -ry * 1.6]);
  return smoothPath(points, true, 0.6);
}

/**
 * Where the hair's gone, for `Hair.balding`: everything but a patch on top,
 * from the crown, growing forward, `grow` times as big (for the thinning
 * round it). A ring of hair is always left round the sides and back.
 */
function notBald(
  d: Drawing,
  look: BodyLook,
  rx: number,
  ry: number,
  grow: number,
): string | undefined {
  const b = look.hair.balding;
  if (b <= 0) {
    return undefined;
  }
  const cx = -rx * 0.22 + b * rx * 0.4;
  const ex = rx * (0.2 + 0.62 * b) * grow;
  const ey = ry * (0.16 + 0.58 * b) * grow;
  const everywhere = `M${n(-rx * 4)} ${n(-ry * 4)}H${n(rx * 4)}V${n(ry * 4)}H${n(-rx * 4)}Z`;
  return d.clipPath(
    `bald${grow}`,
    everywhere + ellipsePath(cx, 0, ex, ey),
    true,
  );
}

/** Draws `draw` inside every one of `clips` that there is */
function clipped(d: Drawing, clips: (string | undefined)[], draw: () => void) {
  const present = clips.filter((clip) => clip !== undefined);
  for (const clip of present) {
    d.begin(`clip-path="url(#${clip})"`);
  }
  draw();
  for (const _ of present) {
    d.end();
  }
}

/**
 * A buzz cut or stubble: the hair no longer than the skull is round, so
 * only its color over the scalp shows, behind the hairline
 */
function drawCropped(
  d: Drawing,
  look: BodyLook,
  rx: number,
  ry: number,
  color: Color,
  skin: Color,
) {
  const buzz = look.hair.cut === "buzz";
  const shade = buzz ? mix(skin, color, 0.82) : mix(skin, color, 0.7);
  const shape = smoothPath(skullPoints(rx, ry, 48, () => (buzz ? 0.015 : 0)));
  // Fainter where it starts, so the hairline isn't a hard edge
  const layers: [number, number, number][] = [
    [9, 1, buzz ? 0.45 : 0.1],
    [0, 1.2, buzz ? 0.9 : 0.2],
  ];
  for (const [forward, grow, opacity] of layers) {
    const hairline = d.clipPath(
      `crop${forward}`,
      hairlinePath(look, rx, ry, forward),
    );
    clipped(d, [hairline, notBald(d, look, rx, ry, grow)], () =>
      d.add(`<path d="${shape}" fill="${shade}" opacity="${n(opacity)}"/>`),
    );
  }
}

/**
 * Eyebrows, behind the eyes. Higher up the face is further back from above,
 * so an arch bows back, and a cross brow's inner end comes forward.
 */
function drawBrows(
  d: Drawing,
  look: BodyLook,
  rx: number,
  ry: number,
  hairColor: Color,
) {
  const { bushiness, arch, tilt } = look.brows;
  const color = look.brows.color ?? darken(hairColor, 0.15);
  const thickness = 5 + bushiness * 15;
  const steps = 8;
  for (const side of [-1, 1]) {
    const top: Pt[] = [];
    const bottom: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      // From the inner end (t = 0) to the outer
      const t = i / steps;
      const y = side * ry * (0.12 + 0.44 * t);
      const x =
        rx * 0.74 -
        Math.sin(t * Math.PI) * arch * 16 -
        tilt * 9 * (1 - t) +
        tilt * 3 * t;
      // Thickest near the inner end, tapering out
      const half =
        (thickness / 2) *
        (1.05 - 0.6 * t) *
        (0.6 + 0.4 * Math.sin((Math.min(1, t * 3 + 0.2) * Math.PI) / 2));

      top.push([x - half, y]);
      bottom.push([x + half, y]);
    }
    d.add(
      `<path d="${smoothPath([...top, ...bottom.reverse()], true, 0.5)}" fill="${color}"/>`,
    );
  }
}

/**
 * Points round the skull from above, `bump(angle)` further out (as a
 * fraction) at each: an egg, narrower at the forehead than at the back,
 * with sides a little squarer than an ellipse's (`STYLE.headEgg`,
 * `headSquare`)
 */
export function skullPoints(
  rx: number,
  ry: number,
  count: number,
  bump: (angle: number) => number = () => 0,
): Pt[] {
  const e = 2 / STYLE.headSquare;
  const points: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const scale = 1 + bump(angle);
    const x = rx * Math.sign(c) * Math.abs(c) ** e;
    const y = ry * Math.sign(s) * Math.abs(s) ** e * (1 - STYLE.headEgg * c);
    points.push([x * scale, y * scale]);
  }
  return points;
}

/** The edge of the hair, all round, as a factor of the skull's radii */
function hairEdge(look: BodyLook, random: () => number) {
  const { volume, messiness, curls } = look.hair;
  const wave = wobble(random, 5, 3);
  const curlCount = 14 + Math.floor(random() * 6);
  const curlPhase = random() * Math.PI;
  return (angle: number) =>
    0.035 +
    volume * 0.2 +
    curls * 0.12 +
    messiness * 0.07 * wave(angle) +
    curls * 0.07 * Math.abs(Math.sin(angle * curlCount + curlPhase));
}

function drawHair(
  d: Drawing,
  look: BodyLook,
  rx: number,
  ry: number,
  color: Color,
  skin: Color,
  random: () => number,
) {
  const hair = look.hair;
  const edge = hairEdge(look, random);
  const count = hair.curls > 0.05 ? 160 : 72;
  const points = skullPoints(rx, ry, count, edge);
  d.includePoints(points);
  const shape = smoothPath(points);

  // Clipped to behind the hairline, and to a strip for a mohawk
  const clips = [d.clipPath("hairline", hairlinePath(look, rx, ry))];
  if (hair.mohawk > 0) {
    const half = ry * (0.12 + hair.mohawk * 0.35);
    clips.push(
      d.clipPath(
        "mohawk",
        polygonPath([
          [-rx * 3, -half],
          [rx * 3, -half],
          [rx * 3, half],
          [-rx * 3, half],
        ]),
      ),
    );
    // Stubble where it's shaved
    d.begin(`clip-path="url(#${clips[0]})"`);
    d.add(
      `<path d="${ellipsePath(0, 0, rx - 4, ry - 4)}" fill="${mix(skin, color, 0.35)}" opacity="0.6"/>`,
    );
    d.end();
  }
  // Thinner just in front of the hairline, so it isn't a hard edge
  if (hair.mohawk <= 0) {
    // Only the band between the two
    d.begin(
      `clip-path="url(#${d.clipPath("thin", hairlinePath(look, rx, ry, 10) + hairlinePath(look, rx, ry), true)})"`,
    );
    d.add(`<path d="${shape}" fill="${color}" opacity="0.45"/>`);
    d.end();
  }
  // Thinning round where it's bald
  if (hair.balding > 0) {
    clipped(d, [...clips, notBald(d, look, rx, ry, 1)], () =>
      d.add(`<path d="${shape}" fill="${color}" opacity="0.5"/>`),
    );
    clips.push(notBald(d, look, rx, ry, 1.25)!);
  }
  for (const clip of clips) {
    d.begin(`clip-path="url(#${clip})"`);
  }
  d.blob(shape, color, { outline: 8 });

  const crown: Pt = [-rx * 0.28, (hair.part ?? 0) * ry * 0.45];
  const strandColor = darken(color, 0.3);
  if (hair.curls > 0.3) {
    // Little curls spread evenly all over (a sunflower's spiral), each
    // turned to follow the round of the head
    const curls = Math.round(30 + hair.curls * 30);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < curls; i++) {
      const angle = i * golden + (random() - 0.5) * 0.3;
      const r = Math.sqrt((i + 0.5) / curls) * 1.02;
      const x = Math.cos(angle) * rx * r;
      const y = Math.sin(angle) * ry * r;
      const size = 12 + random() * 3;
      const turn = (angle * 180) / Math.PI;
      d.add(
        `<path d="M${n(-size)} 0a${n(size)} ${n(size)} 0 1 1 ${n(size)} ${n(size)}" transform="translate(${n(x)} ${n(y)}) rotate(${n(turn)})" fill="none" stroke="${strandColor}" stroke-width="4" opacity="0.5"/>`,
      );
    }
  }
  // A shine across the top
  if (hair.balding < 0.4)
    d.line(
      `M${n(-rx * 0.45)} ${n(-ry * 0.42)}Q${n(-rx * 0.05)} ${n(-ry * 0.62)} ${n(rx * 0.3)} ${n(-ry * 0.38)}`,
      lighten(color, 0.4),
      14,
      `opacity="0.3"`,
    );
  if (hair.part !== undefined) {
    const y = hair.part * ry * 0.45;
    d.line(
      `M${n(crown[0])} ${n(y)}L${n(rx * 0.9)} ${n(y * 0.9)}`,
      darken(color, 0.45),
      6,
    );
  }
  // Patches where it's falling out
  const rot = look.zombie?.rot ?? 0;
  for (let i = 0; i < Math.round(rot * 4 * random()); i++) {
    const angle = random() * Math.PI * 2;
    const r = random() * 0.6;
    const cx = Math.cos(angle) * rx * r;
    const cy = Math.sin(angle) * ry * r;
    const size = 22 + random() * 30;
    const wave = wobble(random, 3, 2);
    d.blob(
      smoothPath(
        ellipsePoints(cx, cy, size, size * 0.8, 9, (a) => 0.3 * wave(a)),
      ),
      skin,
      { grain: "rot", outline: 0 },
    );
  }
  for (const _ of clips) {
    d.end();
  }

  if (hair.bun > 0.02) {
    const r = 34 + hair.bun * 42;
    const cx = -rx * 0.6 - hair.bun * 20;
    d.include(cx - r, -r, cx + r, r);
    d.blob(ellipsePath(cx, 0, r, r * 0.95), color, {});
    d.line(
      `M${n(cx + r * 0.6)} ${n(0)}A${n(r * 0.6)} ${n(r * 0.55)} 0 1 1 ${n(cx)} ${n(-r * 0.55)}A${n(r * 0.3)} ${n(r * 0.3)} 0 1 1 ${n(cx + r * 0.1)} ${n(r * 0.2)}`,
      strandColor,
      5,
      `opacity="0.6"`,
    );
  }
}

function drawLongHair(
  d: Drawing,
  look: BodyLook,
  rx: number,
  ry: number,
  color: Color,
  random: () => number,
) {
  const { length, volume, messiness } = look.hair;
  const wave = wobble(random, 4, 3);
  const width = ry * (1.02 + volume * 0.25);
  const back = rx + length * 230;
  const points: Pt[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Down one side, round the bottom, up the other
    const along = Math.sin(t * Math.PI);
    const x = rx * 0.1 - (rx * 0.1 + back) * Math.pow(along, 0.6);
    const y = -width * Math.cos(t * Math.PI) * (1 - 0.15 * along);
    const jag = 1 + messiness * 0.08 * wave(t * 7);
    points.push([x * jag, y * jag]);
  }
  d.includePoints(points);
  d.blob(smoothPath(points), color, {});
}

function drawPonytail(
  d: Drawing,
  amount: number,
  rx: number,
  ry: number,
  color: Color,
  random: () => number,
) {
  const length = 70 + amount * 250;
  const sway = (random() - 0.5) * 60;
  const start: Pt = [-rx * 0.75, 0];
  const end: Pt = [-rx - length, sway];
  const width = 34 + amount * 18;
  const points: Pt[] = [
    [start[0], -width],
    [(start[0] + end[0]) / 2, sway * 0.4 - width * 1.15],
    [end[0], end[1] - width * 0.35],
    [end[0] - 18, end[1]],
    [end[0], end[1] + width * 0.35],
    [(start[0] + end[0]) / 2, sway * 0.4 + width * 1.15],
    [start[0], width],
  ];
  d.includePoints(points);
  d.blob(smoothPath(points), color, {});
  d.line(
    `M${n(start[0] - 10)} ${n(0)}Q${n((start[0] + end[0]) / 2)} ${n(sway * 0.5)} ${n(end[0])} ${n(end[1])}`,
    darken(color, 0.3),
    5,
    `opacity="0.45"`,
  );
  // The band round it
  d.blob(ellipsePath(-rx * 0.98, 0, 14, width * 0.8), darken(color, 0.55), {
    shade: "flat",
    outline: 0,
  });
}

function drawBeard(
  d: Drawing,
  look: BodyLook,
  rx: number,
  ry: number,
  random: () => number,
) {
  const beard = look.beard!;
  const color = beard.color ?? palette(look).hair;
  const reach = rx * 0.95 + beard.length * 110;
  const wave = wobble(random, 4, 4);
  const points: Pt[] = [];
  for (let i = 0; i <= 20; i++) {
    const angle = -Math.PI * 0.62 + (Math.PI * 1.24 * i) / 20;
    const jag = 1 + look.hair.messiness * 0.06 * wave(angle);
    points.push([
      rx * 0.1 + Math.cos(angle) * (reach - rx * 0.1) * jag,
      Math.sin(angle) * ry * (0.92 + beard.length * 0.12) * jag,
    ]);
  }
  points.push([-rx * 0.1, ry * 0.7], [-rx * 0.1, -ry * 0.7]);
  d.includePoints(points);
  d.blob(smoothPath(points, true, 0.8), color, {});
  for (let i = 0; i < 9; i++) {
    const angle = -0.9 + (1.8 * i) / 8;
    d.line(
      `M${n(rx * 0.6 * Math.cos(angle))} ${n(ry * 0.7 * Math.sin(angle))}L${n(reach * 0.95 * Math.cos(angle))} ${n(ry * 0.9 * Math.sin(angle))}`,
      darken(color, 0.25),
      5,
      `opacity="0.4"`,
    );
  }
}

function drawGlasses(
  d: Drawing,
  shape: "round" | "square" | "shades",
  color: Color,
  rx: number,
  ry: number,
) {
  const front = (y: number) => rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
  const half = ry * 0.62;
  // The arms along each side to the ears
  for (const side of [-1, 1]) {
    const y = side * half;
    d.line(
      `M${n(front(y) - 4)} ${n(y)}Q${n(rx * 0.3)} ${n(side * ry * 0.98)} ${n(-rx * 0.05)} ${n(side * ry * 1.0)}`,
      color,
      8,
    );
  }
  const thickness = shape === "shades" ? 26 : 14;
  const lens = shape === "shades" ? darken(color, 0.4) : color;
  for (const side of [-1, 1]) {
    const y0 = side * half;
    const y1 = side * 16;
    const x0 = front(y0) + 2;
    const x1 = front(y1) + 6;
    const path =
      shape === "round"
        ? `M${n(x0)} ${n(y0)}Q${n(x1 + 14)} ${n((y0 + y1) / 2)} ${n(x1)} ${n(y1)}`
        : `M${n(x0)} ${n(y0)}L${n(x1 + 6)} ${n((y0 + y1) / 2)}L${n(x1)} ${n(y1)}`;
    d.line(path, lens, thickness);
  }
  d.line(
    `M${n(front(16) + 6)} ${n(-16)}Q${n(rx + 4)} 0 ${n(front(16) + 6)} ${n(16)}`,
    color,
    8,
  );
  d.include(rx, -half, rx + 20, half);
}

function drawHat(d: Drawing, hat: Hat, rx: number, ry: number, size: number) {
  const hx = rx * size;
  const hy = ry * size;
  const color = hat.color;
  if (hasHatDrawing(hat.style)) {
    // Drawn by hand for a head as big as the default's, under hair as big as
    // the default's
    drawHatDrawing(d, hat.style, color, hat.secondary, hx / 150 / 1.1);
    return;
  }
  switch (hat.style) {
    case "cap": {
      const brim = ellipsePath(hx * 0.62, 0, hx * 0.66, hy * 0.78);
      d.include(-hx, -hy, hx * 1.28, hy);
      d.blob(brim, darken(hat.secondary ?? color, 0.05), { shade: "flat" });
      d.blob(ellipsePath(-6, 0, hx * 1.02, hy * 1.03), color, {});
      const seam = darken(color, 0.3);
      for (const angle of [Math.PI / 3, (Math.PI * 2) / 3, Math.PI]) {
        for (const side of [-1, 1]) {
          d.line(
            `M${n(-hx * 0.15)} 0L${n(-6 + Math.cos(angle) * hx * 0.98)} ${n(side * Math.sin(angle) * hy * 0.98)}`,
            seam,
            5,
            `opacity="0.6"`,
          );
        }
      }
      d.blob(ellipsePath(-hx * 0.15, 0, 16, 16), color, { outline: 5 });
      return;
    }
    case "beanie": {
      d.include(-hx * 1.1, -hy * 1.1, hx * 1.1, hy * 1.1);
      d.blob(ellipsePath(-4, 0, hx * 1.06, hy * 1.07), color, {});
      d.add(
        `<path d="${ellipsePath(-4, 0, hx * 0.95, hy * 0.95)}" fill="none" stroke="${darken(color, 0.25)}" stroke-width="20" opacity="0.5"/>`,
      );
      if (hat.secondary) {
        d.blob(
          smoothPath(
            ellipsePoints(
              -hx * 0.2,
              0,
              44,
              44,
              18,
              (a) => 0.08 * Math.sin(a * 9),
            ),
          ),
          hat.secondary,
          {},
        );
      }
      return;
    }
    case "hardhat": {
      d.include(-hx * 1.3, -hy * 1.2, hx * 1.35, hy * 1.2);
      d.blob(ellipsePath(10, 0, hx * 1.28, hy * 1.17), darken(color, 0.08));
      d.blob(ellipsePath(-4, 0, hx * 1.0, hy * 0.98), color);
      d.blob(
        `M${n(-hx * 0.95)} -18L${n(hx * 0.95)} -18L${n(hx * 0.95)} 18L${n(-hx * 0.95)} 18Z`,
        lighten(color, 0.12),
        {
          shade: "tube",
          clip: d.clipPath("hardhat", ellipsePath(-4, 0, hx * 1.0, hy * 0.98)),
        },
      );
      return;
    }
    case "santa": {
      const red = color;
      const fur = hat.secondary ?? "#f4f1ea";
      const tip: Pt = [-hx * 1.35, hy * 0.75];
      d.include(tip[0] - 50, -hy * 1.15, hx * 1.15, tip[1] + 50);
      d.blob(ellipsePath(-6, 0, hx * 1.02, hy * 1.02), red, {});
      d.blob(
        smoothPath([
          [-hx * 0.1, -hy * 0.6],
          [-hx * 0.7, hy * 0.1],
          tip,
          [-hx * 0.75, hy * 0.75],
          [hx * 0.05, hy * 0.55],
        ]),
        darken(red, 0.06),
        {},
      );
      d.add(
        `<path d="${ellipsePath(-6, 0, hx * 0.98, hy * 0.98)}" fill="none" stroke="${darken(fur, 0.35)}" stroke-width="34"/>` +
          `<path d="${ellipsePath(-6, 0, hx * 0.98, hy * 0.98)}" fill="none" stroke="${fur}" stroke-width="26"/>`,
      );
      d.blob(
        smoothPath(
          ellipsePoints(
            tip[0],
            tip[1],
            42,
            42,
            16,
            (a) => 0.1 * Math.sin(a * 7),
          ),
        ),
        fur,
        {},
      );
      return;
    }
    case "bandana": {
      const cloth = color;
      d.include(-hx * 1.6, -hy * 1.05, hx * 1.05, hy * 1.05);
      // The knot's tails at the back
      for (const side of [-1, 1]) {
        d.blob(
          smoothPath([
            [-hx * 0.9, side * 12],
            [-hx * 1.35, side * 40],
            [-hx * 1.55, side * 70],
            [-hx * 1.25, side * 30],
          ]),
          cloth,
          {},
        );
      }
      d.blob(ellipsePath(-14, 0, hx * 0.98, hy * 1.02), cloth, {});
      if (hat.secondary) {
        d.begin(
          `clip-path="url(#${d.clipPath("bandana", ellipsePath(-14, 0, hx * 0.98, hy * 1.02))})"`,
        );
        for (let x = -hx; x < hx; x += 46) {
          for (let y = -hy; y < hy; y += 46) {
            d.add(
              `<circle cx="${n(x + ((y / 46) % 2) * 23)}" cy="${n(y)}" r="9" fill="${hat.secondary}" opacity="0.85"/>`,
            );
          }
        }
        d.end();
      }
      return;
    }
    case "beret": {
      d.include(-hx * 1.2, -hy * 1.2, hx * 1.2, hy * 1.3);
      d.blob(ellipsePath(-14, 18, hx * 1.12, hy * 1.12), color, {});
      d.blob(ellipsePath(-14, 18, 12, 12), darken(color, 0.15), { outline: 4 });
      return;
    }
  }
}

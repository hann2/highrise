import { BodyLook, EYE_COLOR, Hat, isCropped } from "../BodyLook";
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
import { DangleDrawing, hang } from "../dangles";

/**
 * The head from above, facing +x, the skull's middle at the origin: hair,
 * ears, nose, brows, a beard, glasses and a hat. `faceDown`, lying on its
 * face (a corpse, a crawler), so what shows is the back of the head, with
 * the top of it toward +x: no face, and hair right over it.
 */
export function drawHead(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
  faceDown = false,
  /** Given, things that swing are drawn on their own into it, not on the head */
  dangles?: DangleDrawing[],
): Drawing {
  const { headRx: rx, headRy: ry } = dims;
  const colors = palette(look);
  const rot = look.zombie?.rot ?? 0;
  const skinGrain = rot > 0 ? "rot" : undefined;
  if (faceDown && look.hair.coverage > 0) {
    // Hair from the crown right over to the top of the head
    look = {
      ...look,
      hair: {
        ...look.hair,
        coverage: 1,
        fringe: -0.4,
        hairline: "natural",
        style: look.hair.style === "spiky" ? "loose" : look.hair.style,
        part: undefined,
      },
    };
  }
  const hair = look.hair;
  const random = lookRandom(look, 1);
  const d = new Drawing(prefix, -rx, -ry, rx, ry);
  d.include(-rx * 1.1, -ry * 1.15, rx * 1.1, ry * 1.15);

  // Hair down the back, under everything
  if (hair.coverage > 0 && hair.style === "loose" && hair.length > 0.02) {
    drawLongHair(d, look, rx, ry, colors.hair, random);
  }
  if (hair.coverage > 0 && hair.style === "ponytail") {
    if (dangles) {
      // On its own, to swing from where it's tied
      const tail = new Drawing(`${prefix}-pt`, -rx, 0, -rx, 0);
      const tip = drawPonytail(
        tail,
        hair.length,
        rx,
        ry,
        colors.hair,
        random,
        PONYTAIL_HANGING,
      );
      dangles.push(hang("ponytail", "head", tail, [-rx * 0.9, 0], tip));
    } else {
      drawPonytail(d, hair.length, rx, ry, colors.hair, random);
    }
  }
  if (hair.coverage > 0 && hair.style === "pigtails") {
    // Tied either side of the back of the head, each hanging back and out
    for (const side of [-1, 1]) {
      const way = Math.PI - side * PIGTAIL_ANGLE;
      const root: Pt = [Math.cos(way) * rx * 0.75, Math.sin(way) * ry * 0.75];
      const place = { root, angle: way, width: PIGTAIL_WIDTH };
      if (dangles) {
        const tail = new Drawing(`${prefix}-pg${side}`, ...root, ...root);
        const tip = drawPonytail(
          tail,
          hair.length,
          rx,
          ry,
          colors.hair,
          random,
          PONYTAIL_HANGING,
          place,
        );
        const pivot: Pt = [
          root[0] + Math.cos(way) * rx * 0.15,
          root[1] + Math.sin(way) * rx * 0.15,
        ];
        dangles.push(hang("ponytail", "head", tail, pivot, tip));
      } else {
        drawPonytail(d, hair.length, rx, ry, colors.hair, random, 1, place);
      }
    }
  }

  // Ears, a nose, a beard: whatever sticks out from under the skull
  for (const side of [-1, 1]) {
    d.blob(ellipsePath(-rx * 0.06, side * ry * 0.97, 24, 31), colors.skin, {
      grain: skinGrain,
    });
  }
  if (look.beard && look.beard.length > 0 && !faceDown) {
    drawBeard(d, look, rx, ry, random);
  }
  if (!faceDown) {
    d.blob(ellipsePath(rx * 0.95, 0, 27, 20), colors.skin, {
      grain: skinGrain,
    });
    d.include(rx * 0.95 + 27, -20, rx * 0.95 + 27, 20);
  }

  const skull = smoothPath(skullPoints(rx, ry, 48));
  d.blob(skull, colors.skin, { grain: skinGrain });
  if (hair.coverage <= 0) {
    // Bald: a shine across the top, as hair has, duller the more it's rotted
    d.line(
      `M${n(-rx * 0.4)} ${n(-ry * 0.4)}Q${n(-rx * 0.05)} ${n(-ry * 0.58)} ${n(rx * 0.25)} ${n(-ry * 0.36)}`,
      lighten(colors.skin, 0.5),
      16,
      `opacity="${n(0.4 * (1 - rot))}"`,
    );
  }

  // Eyes and brows at the front edge, unless the hair hides them
  if (!faceDown) {
    drawEyes(d, rx, ry, colors.skin, look.eyes ?? EYE_COLOR, rot);
    drawBrows(d, look, rx, ry, colors.hair);
  }

  if (hair.coverage > 0 && isCropped(hair)) {
    drawCropped(d, look, rx, ry, colors.hair, colors.skin);
  } else if (hair.coverage > 0) {
    // Under a hat, the bun stays put
    drawHair(
      d,
      look,
      rx,
      ry,
      colors.hair,
      colors.skin,
      random,
      look.hat ? undefined : dangles,
    );
  }
  if (look.glasses && !faceDown) {
    drawGlasses(d, look.glasses.shape, look.glasses.color, rx, ry);
  }
  if (look.hat) {
    // Big enough to cover the hair's edge at its furthest
    const hairOut =
      hair.coverage > 0 && !isCropped(hair)
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

/**
 * The eyes, at the front edge of the head: from above only a sliver of
 * each shows, under the brow, flat along the face and curving back into the
 * head, with the line of the upper lid in front
 */
function drawEyes(
  d: Drawing,
  rx: number,
  ry: number,
  skin: Color,
  iris: Color,
  rot: number,
) {
  const dead = rot > 0.5;
  const white = dead ? "#c9c7a0" : mix("#f4f1ea", skin, 0.12);
  for (const side of [-1, 1]) {
    const y = side * ry * 0.3;
    // Just inside the skull's front edge there
    const e = STYLE.headSquare;
    const x = rx * (1 - Math.abs(y / ry) ** e) ** (1 / e) - 9;
    d.add(
      `<g transform="rotate(${side * 14} ${n(x)} ${n(y)})">` +
        `<path d="M${n(x + 2)} ${n(y - 19)}Q${n(x + 5)} ${n(y)} ${n(x + 2)} ${n(y + 19)}Q${n(x - 16)} ${n(y)} ${n(x + 2)} ${n(y - 19)}Z" fill="${white}"/>` +
        (dead
          ? ""
          : `<ellipse cx="${n(x - 1)}" cy="${n(y)}" rx="5" ry="8" fill="${iris}"/>` +
            `<ellipse cx="${n(x)}" cy="${n(y)}" rx="2.6" ry="4" fill="#1c1714"/>`) +
        `<path d="M${n(x + 1)} ${n(y - 20)}Q${n(x + 6)} ${n(y)} ${n(x + 1)} ${n(y + 20)}" fill="none" stroke="${darken(skin, 0.5)}" stroke-width="4" stroke-linecap="round"/></g>`,
    );
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

/** Where a parting meets the hairline, across the head (as a share of its half-width), at `Hair.part` 1 */
const PART_AT = 0.41;

/**
 * Where the hairline is (x, mm) across the head at `y`: how far forward the
 * hair comes there, by its coverage, fringe and shape (`Hairline`), or
 * where spiky hair's tufts start
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
  switch (hair.style === "spiky" ? "spiky" : hair.hairline) {
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
    case "parted": {
      // A notch at the parting, the hair falling forward either side of it,
      // and swept across from a side parting: forward on the far side
      const part = hair.part ?? 0;
      const q = Math.abs(u - PART_AT * part);
      const sweep = Math.min(1, Math.abs(part) * 1.5);
      shape =
        0.08 * (1 - t) -
        0.16 * Math.max(0, 1 - q / 0.25) +
        0.06 * bell(q, 0.5, 0.2) +
        0.12 * sweep * Math.max(-1, Math.min(1, -Math.sign(part) * u)) +
        sideburns;
      break;
    }
    case "spiky":
      // Where the tufts start (`spikes` adds them)
      shape = 0.02 * (1 - t) - 0.06 * bell(a, 0.75, 0.16) + sideburns;
      break;
  }
  return base + (shape + fringe) * rx;
}

/**
 * The tufts of `spiky` hair across the front, each a point sticking
 * forward from where the hairline would be, leaning as `Hair.lean` says, as
 * `[left foot, tip, right foot]`, the feet joined from one tuft to the next.
 * More volume makes fewer, bigger ones.
 */
function spikes(look: BodyLook, rx: number, ry: number): [Pt, Pt, Pt][] {
  const random = lookRandom(look, 9);
  const volume = look.hair.volume;
  const count = Math.round(8 - 3 * volume);
  const from = -ry * 0.88;
  const width = (ry * 1.76) / count;
  const tufts: [Pt, Pt, Pt][] = [];
  for (let i = 0; i < count; i++) {
    const y0 = from + i * width;
    const y1 = y0 + width;
    const mid = (y0 + y1) / 2;
    // Shorter out to the sides
    const out = 1 - 0.55 * (mid / ry) ** 2;
    // Long and short in turn, and no two alike, more so the messier
    const vary =
      (i % 2 ? 0.8 : 1.1) +
      (random() - 0.5) * (0.3 + look.hair.messiness * 0.6);
    const length = rx * (0.24 + 0.16 * volume) * out * vary;
    const lean = look.hair.lean * width * (0.6 + 0.8 * random());
    const foot = (y: number) => hairlineAt(look, rx, ry, y) - rx * 0.03;
    tufts.push([
      [foot(y0), y0],
      [hairlineAt(look, rx, ry, mid) + length, mid + lean],
      [foot(y1), y1],
    ]);
  }
  return tufts;
}

/** The region behind the hairline, as a path, `forward` mm further forward */
function hairlinePath(look: BodyLook, rx: number, ry: number, forward = 0) {
  if (look.hair.style === "spiky") {
    // Sharp: straight lines between the tufts' points
    const tufts = spikes(look, rx, ry);
    const points: Pt[] = [];
    const along = (y0: number, y1: number) => {
      for (let i = 0; i <= 8; i++) {
        const y = y0 + ((y1 - y0) * i) / 8;
        points.push([hairlineAt(look, rx, ry, y) + forward, y]);
      }
    };
    along(-ry * 1.6, tufts[0][0][1]);
    for (const [, tip, foot] of tufts) {
      points.push([tip[0] + forward, tip[1]], [foot[0] + forward, foot[1]]);
    }
    along(tufts[tufts.length - 1][2][1], ry * 1.6);
    points.push([-rx * 3, ry * 1.6], [-rx * 3, -ry * 1.6]);
    return polygonPath(points);
  }
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
  const buzz = look.hair.style === "buzz";
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
  /** Given, the bun is drawn on its own into it, to wobble */
  dangles?: DangleDrawing[],
) {
  const hair = look.hair;
  const edge = hairEdge(look, random);
  const count = hair.curls > 0.05 ? 160 : 72;
  const points = skullPoints(rx, ry, count, edge);
  d.includePoints(points);
  const shape = smoothPath(points);

  // Clipped to behind the hairline, and to a strip for a mohawk
  const clips = [d.clipPath("hairline", hairlinePath(look, rx, ry))];
  if (hair.style === "mohawk") {
    const half = ry * (0.12 + hair.mohawkWidth * 0.35);
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
  // Thinner just in front of the hairline, so it isn't a hard edge (but
  // spikes are sharp)
  if (hair.style !== "mohawk" && hair.style !== "spiky") {
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

  // The parting, from the crown to where it meets the hairline
  const part = hair.hairline === "parted" ? (hair.part ?? 0) : undefined;
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
  if (part !== undefined) {
    const y = part * ry * 0.45;
    d.line(
      `M${n(-rx * 0.28)} ${n(y)}L${n(rx * 0.9)} ${n(part * ry * PART_AT)}`,
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

  if (hair.style === "bun") {
    const r = 34 + hair.length * 42;
    const cx = -rx * 0.6 - hair.length * 20;
    const bun = dangles ? new Drawing(`${d.prefix}-bun`, cx, 0, cx, 0) : d;
    bun.include(cx - r, -r, cx + r, r);
    bun.blob(ellipsePath(cx, 0, r, r * 0.95), color, {});
    bun.line(
      `M${n(cx + r * 0.6)} ${n(0)}A${n(r * 0.6)} ${n(r * 0.55)} 0 1 1 ${n(cx)} ${n(-r * 0.55)}A${n(r * 0.3)} ${n(r * 0.3)} 0 1 1 ${n(cx + r * 0.1)} ${n(r * 0.2)}`,
      strandColor,
      5,
      `opacity="0.6"`,
    );
    if (dangles) {
      // Wobbling about where it's pinned, its front edge, over the hair
      dangles.push({
        ...hang("bun", "head", bun, [cx + r * 0.8, 0], [cx - r, 0]),
        above: true,
      });
    }
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

/**
 * How much of a ponytail's length shows from above, standing: it hangs down
 * the back, and only swings out to all of it (see `DANGLE_STYLES`)
 */
const PONYTAIL_HANGING = 0.7;

/** How far round from straight back each pigtail's tied (radians) */
const PIGTAIL_ANGLE = 0.8;
/** How thick a pigtail is next to a ponytail: there's half the hair in each */
const PIGTAIL_WIDTH = 0.72;

/** Where a ponytail's tied, which way it hangs from there, and how thick it is next to one tied at the back */
interface TailPlace {
  root: Pt;
  angle: number;
  width: number;
}

function drawPonytail(
  d: Drawing,
  amount: number,
  rx: number,
  ry: number,
  color: Color,
  random: () => number,
  /** How much of its length shows from above */
  reach = 1,
  /** Else at the back, hanging straight back */
  place: TailPlace = { root: [-rx * 0.75, 0], angle: Math.PI, width: 1 },
): Pt {
  const length = (70 + amount * 250) * reach;
  const sway = (random() - 0.5) * 60;
  // Drawn along the way it hangs (`u`, from its root) and across it (`v`)
  const cos = Math.cos(place.angle);
  const sin = Math.sin(place.angle);
  const at = (u: number, v: number): Pt => [
    place.root[0] + u * cos + v * sin,
    place.root[1] + u * sin - v * cos,
  ];
  const endU = rx * 0.25 + length;
  const end = at(endU, sway);
  const width = (34 + amount * 18) * place.width;
  const points: Pt[] = [
    at(0, -width),
    at(endU / 2, sway * 0.4 - width * 1.15),
    at(endU, sway - width * 0.35),
    at(endU + 18, sway),
    at(endU, sway + width * 0.35),
    at(endU / 2, sway * 0.4 + width * 1.15),
    at(0, width),
  ];
  d.includePoints(points);
  d.blob(smoothPath(points), color, {});
  const [sx, sy] = at(10, 0);
  const [mx, my] = at(endU / 2, sway * 0.5);
  d.line(
    `M${n(sx)} ${n(sy)}Q${n(mx)} ${n(my)} ${n(end[0])} ${n(end[1])}`,
    darken(color, 0.3),
    5,
    `opacity="0.45"`,
  );
  // The band round it
  const [bx, by] = at(rx * 0.23, 0);
  d.add(
    `<g transform="translate(${n(bx)} ${n(by)}) rotate(${n(((place.angle - Math.PI) * 180) / Math.PI)})">`,
  );
  d.blob(ellipsePath(0, 0, 14, width * 0.8), darken(color, 0.55), {
    shade: "flat",
    outline: 0,
  });
  d.add("</g>");
  return end;
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

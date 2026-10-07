import { elbowPosition } from "../creature-stuff/armReach";
import { STYLE } from "./style";
import { FOOT_FORWARD, HEM_OVERLAP, HIP_WIDTH } from "../creature-stuff/Legs";
import { BodyLook, PartialLook } from "./BodyLook";
import { BodyDrawing, BodyLayer, drawBody, LAYER_PARTS } from "./drawBody";
import { Drawing, n } from "./svg";
import { lyingHead, lyingShoulder, lyingWaist } from "./parts/torso";
import { armHandPosition, hasSleeve } from "./parts/limbs";
import {
  ArmPose,
  SLEEVE_BEND,
  sleeveColumnCount,
  sleeveColumns,
  sleeveStrip,
  sleeveUvs,
} from "../creature-stuff/sleeveStrip";
import {
  hemAngles,
  hemRest,
  hemStill,
  isClosed,
  LegAtHem,
  RINGS,
} from "../creature-stuff/hemCloth";
import { HemDrawing } from "./hems";

export interface ComposeOptions {
  /** Standing mid-stride, or lying face down like a corpse */
  pose?: "standing" | "lying";
  /** Where the hands are, from the middle, in mm (standing) */
  hands?: [[number, number], [number, number]];
  /** How far each foot is from under its hip, mid-stride (mm) */
  stride?: number;
  /** Pixels per meter */
  scale?: number;
  /** Facing up the page, as players think of it, instead of along +x */
  faceUp?: boolean;
  /** Lying down without its legs, like a crawler */
  legless?: boolean;
  /** Layers left out, to see what's under them */
  hidden?: readonly BodyLayer[];
}

function place(part: Drawing, transform: string): string {
  return `<g transform="${transform}">${part.content()}</g>`;
}

/**
 * A sleeve's straight picture bent over an arm as `BodySprite` bends it
 * (`sleeveStrip`), drawn from the shoulder to the hand. `pixel` is how big
 * a pixel is (mm).
 */
function bentSleeve(part: Drawing, pose: ArmPose, pixel: number): string {
  const picture = {
    from: part.minX,
    to: part.maxX,
    top: part.minY,
    bottom: part.maxY,
  };
  const along = sleeveColumns(
    picture,
    pose.upperArm,
    pose.bend,
    sleeveColumnCount(picture, pose.upperArm, pose.bend),
  );
  const columns = along.length;
  const posed = sleeveStrip(
    picture,
    pose,
    along,
    new Float32Array(columns * 4),
  );
  const uvs = sleeveUvs(picture, along);
  const triangles: MeshTriangle[] = [];
  for (let i = 0; i < columns - 1; i++) {
    // Each quad's two triangles, as `sleeveIndices` has them: the first past
    // the diagonal, which the second covers, and the second past the next
    // column, which the next quad covers
    triangles.push([i * 2, i * 2 + 1, i * 2 + 2, [[1, 2]]]);
    triangles.push([
      i * 2 + 1,
      i * 2 + 2,
      i * 2 + 3,
      i < columns - 2 ? [[1, 2]] : [],
    ]);
  }
  return meshSvg(
    part,
    (v) => [
      picture.from + uvs[v * 2] * (picture.to - picture.from),
      picture.top + uvs[v * 2 + 1] * (picture.bottom - picture.top),
    ],
    (v) => [posed[v * 2], posed[v * 2 + 1]],
    triangles,
    pixel,
  );
}

/**
 * Cloth hanging from the waist (`HemCloth`) as it hangs still, pushed out
 * by the legs where they come through it (in the hips' frame), drawn round
 * from the front. `pixel` is how big a pixel is (mm).
 */
function hangingHem(hem: HemDrawing, legs: LegAtHem[], pixel: number): string {
  const angles = hemAngles(hem.shape);
  const rest = hemRest(hem.shape, angles);
  const posed = hemStill(hem.shape, angles, legs);
  const count = angles.length;
  const closed = isClosed(hem.shape);
  const v = (i: number, ring: number) => (i % count) * RINGS + ring;
  const triangles: MeshTriangle[] = [];
  if (closed) {
    // The middle's fan, each past its edge round the waist, which the ring covers
    for (let i = 0; i < count; i++) {
      triangles.push([count * RINGS, v(i, 0), v(i + 1, 0), [[1, 2]]]);
    }
  }
  const quads = closed ? count : count - 1;
  for (let r = 0; r < RINGS - 1; r++) {
    // Each ring's quads, from the waist out: the first triangle past the
    // diagonal, and the second past the next point's edge (but the last's,
    // which comes round to the first) and the ring's edge further out
    const outer = r < RINGS - 2;
    for (let i = 0; i < quads; i++) {
      const last = i === quads - 1;
      triangles.push([v(i, r), v(i, r + 1), v(i + 1, r), [[1, 2]]]);
      triangles.push([
        v(i, r + 1),
        v(i + 1, r),
        v(i + 1, r + 1),
        [
          ...(last ? [] : [[1, 2] as [number, number]]),
          ...(outer ? [[0, 2] as [number, number]] : []),
        ],
      ]);
    }
  }
  return meshSvg(
    hem.drawing,
    (i) => [rest[i * 2], rest[i * 2 + 1]],
    (i) => [posed[i * 2], posed[i * 2 + 1]],
    triangles,
    pixel,
  );
}

/**
 * A triangle of a mesh, by its vertices, and which of its edges (by the
 * corners' places in the triangle) to draw a band past, away from its
 * other corner, which what's drawn after it covers
 */
type MeshTriangle = [number, number, number, [number, number][]];

/**
 * `part`'s picture laid over a mesh of triangles: each triangle the
 * picture's own triangle (`flat`) mapped onto where it's posed (`at`). They're
 * drawn in order, each clipped to itself and a band a couple of pixels wide
 * past an edge that the next covers: so the edges inside the mesh fall on
 * something already there, and no seams show between them. `pixel` is how
 * big a pixel is (mm).
 */
function meshSvg(
  part: Drawing,
  flat: (v: number) => [number, number],
  at: (v: number) => [number, number],
  triangles: MeshTriangle[],
  pixel: number,
): string {
  const id = `${part.prefix}-mesh`;
  const polygon = (points: [number, number][]) =>
    `<polygon points="${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}"/>`;
  const defs: string[] = [];
  const drawn: string[] = [];
  for (const [a, b, c, bands] of triangles) {
    const corners = [at(a), at(b), at(c)];
    const [o, p, q] = corners;
    const shapes = [polygon([o, p, q])];
    for (const [from, to] of bands) {
      const p = corners[from];
      const q = corners[to];
      const o = corners[3 - from - to];
      // Square to the edge, away from the triangle's other corner
      const [ex, ey] = [q[1] - p[1], p[0] - q[0]];
      const away = ex * (p[0] - o[0]) + ey * (p[1] - o[1]) >= 0 ? 1 : -1;
      const out = (away * pixel * 2) / (Math.hypot(ex, ey) || 1);
      shapes.push(
        polygon([
          p,
          q,
          [q[0] + ex * out, q[1] + ey * out],
          [p[0] + ex * out, p[1] + ey * out],
        ]),
      );
    }
    const clip = `${id}-${drawn.length}`;
    defs.push(`<clipPath id="${clip}">${shapes.join("")}</clipPath>`);
    const matrix = affine([flat(a), flat(b), flat(c)], [o, p, q]);
    drawn.push(
      `<g clip-path="url(#${clip})"><use href="#${id}" transform="matrix(${matrix.map((v) => v.toFixed(4)).join(" ")})"/></g>`,
    );
  }
  return (
    // Without the shadow it casts, which each triangle would cast again
    `<defs><g id="${id}">${part.content(false)}</g>${defs.join("")}</defs>` +
    drawn.join("")
  );
}

/** The affine map taking the triangle `from` onto `to`, as SVG's `matrix(a b c d e f)` */
function affine(
  [p0, p1, p2]: [number, number][],
  [q0, q1, q2]: [number, number][],
): number[] {
  const t00 = p1[0] - p0[0];
  const t01 = p2[0] - p0[0];
  const t10 = p1[1] - p0[1];
  const t11 = p2[1] - p0[1];
  const det = t00 * t11 - t01 * t10;
  const q00 = q1[0] - q0[0];
  const q01 = q2[0] - q0[0];
  const q10 = q1[1] - q0[1];
  const q11 = q2[1] - q0[1];
  const a = (q00 * t11 - q01 * t10) / det;
  const c = (q01 * t00 - q00 * t01) / det;
  const b = (q10 * t11 - q11 * t10) / det;
  const d = (q11 * t00 - q10 * t01) / det;
  return [
    a,
    b,
    c,
    d,
    q0[0] - a * p0[0] - c * p0[1],
    q0[1] - b * p0[0] - d * p0[1],
  ];
}

/**
 * A whole body as one SVG, put together the way `BodySprite` does in the
 * game (standing) or a `Corpse` (lying): for the character editor, the
 * encyclopedia, and contact sheets.
 */
export function composeBodySvg(
  look: PartialLook | BodyDrawing,
  options: ComposeOptions = {},
  prefix = "c",
): string {
  const body = "parts" in look ? look : drawBody(look, prefix);
  const { dims } = body;
  // Hidden parts are left empty, the same size, so everything else is where it was
  const parts = { ...body.parts };
  for (const layer of options.hidden ?? []) {
    for (const part of LAYER_PARTS[layer]) {
      const d = parts[part];
      parts[part] = new Drawing(`${prefix}-x`, d.minX, d.minY, d.maxX, d.maxY);
    }
  }
  const {
    pose = "standing",
    stride = 150,
    scale = 200,
    faceUp = true,
  } = options;
  const items: string[] = [];
  let box: [number, number, number, number];

  if (pose === "standing") {
    const hip = HIP_WIDTH * 1000;
    const legThickness = dims.legThickness;
    const leg = parts.leg;
    // Feet first, under the legs
    for (const side of [-1, 1]) {
      const along = -side * stride;
      items.push(
        place(
          side < 0 ? parts.leftFoot : parts.rightFoot,
          `translate(${n(along + FOOT_FORWARD * 1000)} ${n(side * hip)})`,
        ),
      );
    }
    // The left foot forward, the right back, like the editor always showed;
    // each leg stretched from its hip to its ankle, as `BodySprite` does
    for (const side of [-1, 1]) {
      const along = -side * stride;
      const stretch =
        (Math.abs(along) + legThickness * (0.5 + HEM_OVERLAP)) / leg.width;
      items.push(
        place(
          leg,
          along >= 0
            ? `translate(${n(-legThickness / 2)} ${n(side * hip)}) scale(${stretch.toFixed(3)} 1)`
            : `translate(${n(legThickness / 2)} ${n(side * hip)}) rotate(180) scale(${stretch.toFixed(3)} 1)`,
        ),
      );
    }
    // What hangs from the waist, over the legs, pushed out where they
    // come through it
    const hems = body.hems.filter(
      (hem) => !options.hidden?.includes(hem.layer),
    );
    for (const hem of hems) {
      items.push(
        hangingHem(
          hem,
          [-1, 1].map((side) => ({
            x: -side * stride * hem.shape.drop,
            y: side * hip,
            radius: legThickness / 2,
          })),
          1000 / scale,
        ),
      );
    }
    const shoulder = dims.shoulderHalfWidth - dims.armThickness / 2;
    const hands = options.hands ?? [
      [300, -200],
      [300, 200],
    ];
    const arms = [
      [parts.leftUpperArm, parts.leftForearm, parts.leftHand, -1, hands[0]],
      [parts.rightUpperArm, parts.rightForearm, parts.rightHand, 1, hands[1]],
    ] as const;
    // Bent at the elbow, as `BodySprite` has them
    const segment = (
      part: Drawing,
      [x0, y0]: readonly [number, number],
      [x1, y1]: readonly [number, number],
      length: number,
    ) =>
      place(
        part,
        `translate(${n(x0)} ${n(y0)}) rotate(${n((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI)}) scale(${(Math.hypot(x1 - x0, y1 - y0) / length).toFixed(3)} 1)`,
      );
    let elbowReach = Math.max(
      ...hands.map(([, hy]) => Math.abs(hy) + dims.handSize * 0.6),
    );
    for (const [upper, fore, , side, hand] of arms) {
      const shoulderAt = [0, side * shoulder] as const;
      const elbow = elbowPosition(
        shoulderAt,
        hand,
        dims.upperArm,
        dims.forearm,
        STYLE.armDrop,
        STYLE.elbowOut,
      );
      elbowReach = Math.max(
        elbowReach,
        Math.abs(elbow[1]) + dims.armThickness / 2 + 10,
      );
      items.push(segment(upper, shoulderAt, elbow, dims.upperArm));
      items.push(segment(fore, elbow, hand, dims.forearm));
      if (hasSleeve(body.look)) {
        items.push(
          bentSleeve(
            side < 0 ? parts.leftSleeve : parts.rightSleeve,
            {
              shoulder: shoulderAt,
              elbow,
              hand,
              upperArm: dims.upperArm,
              forearm: dims.forearm,
              bend: dims.armThickness * SLEEVE_BEND,
            },
            1000 / scale,
          ),
        );
      }
    }
    for (const [, , hand, , [hx, hy]] of arms) {
      items.push(place(hand, `translate(${n(hx)} ${n(hy)})`));
    }
    items.push(place(parts.torso, ""));
    // What swings, hanging at rest, unless what it hangs off is hidden:
    // under the head, and over it
    const hanging = (above: boolean) =>
      body.dangles
        .filter(
          (dangle) =>
            !!dangle.above === above && !options.hidden?.includes(dangle.on),
        )
        .map((dangle) =>
          place(
            dangle.drawing,
            `translate(${n(dangle.pivot[0])} ${n(dangle.pivot[1])}) rotate(${n((dangle.angle * 180) / Math.PI)})`,
          ),
        );
    items.push(...hanging(false));
    items.push(place(parts.head, ""));
    items.push(...hanging(true));
    // Where the dangles' corners are, hanging at rest
    const dangleCorners = body.dangles.flatMap(({ drawing: d, pivot, angle }) =>
      [
        [d.minX, d.minY],
        [d.maxX, d.minY],
        [d.maxX, d.maxY],
        [d.minX, d.maxY],
      ].map(([x, y]) => [
        pivot[0] + x * Math.cos(angle) - y * Math.sin(angle),
        pivot[1] + x * Math.sin(angle) + y * Math.cos(angle),
      ]),
    );
    const reach = Math.max(
      dims.shoulderHalfWidth + 40,
      elbowReach,
      -parts.torso.minY,
      parts.torso.maxY,
      -parts.head.minY,
      parts.head.maxY,
      ...dangleCorners.map(([, y]) => Math.abs(y)),
      ...hems.map((hem) => Math.max(-hem.drawing.minY, hem.drawing.maxY)),
    );
    box = [
      Math.min(
        -stride - 200,
        parts.torso.minX,
        parts.head.minX,
        ...dangleCorners.map(([x]) => x),
        ...hems.map((hem) => hem.drawing.minX - stride * hem.shape.drop),
      ),
      -reach,
      Math.max(
        420,
        parts.torso.maxX,
        parts.head.maxX,
        ...hands.map(([hx]) => hx + dims.handSize * 0.6),
        ...dangleCorners.map(([x]) => x),
        ...hems.map((hem) => hem.drawing.maxX + stride * hem.shape.drop),
      ),
      reach,
    ];
  } else {
    // Face down: the legs, then the arms, both under the top half (the
    // arms' round ends at the shoulders hidden, as standing), its hem over
    // the legs, and the head turned to one side. One arm's up by the head,
    // the other down by its side, which way round by its seed
    const shoulder = lyingShoulder(dims);
    const waist = -lyingWaist(dims);
    const handAt = armHandPosition(dims);
    if (!options.legless) {
      items.push(place(parts.lyingLegs, `translate(${n(waist)} 0)`));
    }
    const up = body.look.seed % 2 === 0 ? -1 : 1;
    const hands: [number, number][] = [];
    for (const [arm, hand, side] of [
      [parts.leftArm, parts.leftFlatHand, -1],
      [parts.rightArm, parts.rightFlatHand, 1],
    ] as const) {
      const angle = side === up ? side * 55 : side * 165;
      const rad = (angle * Math.PI) / 180;
      const at: [number, number] = [
        Math.cos(rad) * handAt,
        side * shoulder + Math.sin(rad) * handAt,
      ];
      hands.push(at);
      items.push(
        place(arm, `translate(0 ${n(side * shoulder)}) rotate(${angle})`),
        place(hand, `translate(${n(at[0])} ${n(at[1])}) rotate(${angle})`),
      );
    }
    // Whole, or torn off at the waist without its legs
    items.push(place(options.legless ? parts.lyingTorso : parts.lyingTop, ""));
    const headAt = lyingHead(dims);
    items.push(place(parts.turnedHead, `translate(${n(headAt)} 0)`));
    const reach = Math.max(
      dims.shoulderHalfWidth + 120,
      ...hands.map(([, y]) => Math.abs(y) + dims.handSize * 0.6),
      parts.lyingLegs.maxY,
      -parts.lyingLegs.minY,
    );
    box = [
      options.legless ? parts.lyingTorso.minX : waist + parts.lyingLegs.minX,
      -reach,
      Math.max(
        headAt + parts.turnedHead.maxX,
        ...hands.map(([x]) => x + dims.handSize * 0.6),
      ),
      reach,
    ];
  }

  let [x0, y0, x1, y1] = box;
  let content = items.join("");
  if (faceUp) {
    content = `<g transform="rotate(-90)">${content}</g>`;
    [x0, y0, x1, y1] = [y0, -x1, y1, -x0];
  }
  const w = x1 - x0;
  const h = y1 - y0;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n((w * scale) / 1000)}" height="${n((h * scale) / 1000)}" viewBox="${n(x0)} ${n(y0)} ${n(w)} ${n(h)}">` +
    content +
    `</svg>`
  );
}

/** One part on its own, as an SVG document */
export function partSvg(part: Drawing, scale = 200): string {
  return part.toSvg(scale);
}

/** An SVG as a URL an `<img>` can show */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const portraits = new Map<string, string>();

/** A whole body as an image URL, made once per look and options */
export function portraitUrl(
  look: BodyLook,
  options: ComposeOptions = {},
): string {
  const key = JSON.stringify([look, options]);
  let url = portraits.get(key);
  if (!url) {
    url = svgDataUrl(
      composeBodySvg(look, options, `portrait${portraits.size}`),
    );
    portraits.set(key, url);
  }
  return url;
}

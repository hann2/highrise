import { elbowPosition } from "../creature-stuff/armReach";
import { STYLE } from "./style";
import { FOOT_FORWARD, HEM_OVERLAP, HIP_WIDTH } from "../creature-stuff/Legs";
import { BodyLook, PartialLook } from "./BodyLook";
import { BodyDrawing, BodyLayer, drawBody, LAYER_PARTS } from "./drawBody";
import { Drawing, n } from "./svg";
import { lyingHead, lyingShoulder, lyingWaist } from "./parts/torso";
import { lyingLegShape } from "./parts/legs";
import { DeathContext, limbJoints, lyingPose, NO_DEATH } from "./lyingPose";
import { makeRandom } from "../../core/util/Random";
import { lookRandom } from "./dimensions";
import { armShoulderJoint, hasSleeve } from "./parts/limbs";
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
  hemPictureAngles,
  hemRest,
  hemStill,
  hemStrips,
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
  /**
   * Lying, how it died, which decides how it lies (`lyingPose`): what's
   * missing is left out, a stump where it was. Else it just dropped
   */
  death?: DeathContext;
  /** Lying, what picks its pose, else its look's seed */
  poseSeed?: number;
}

function place(part: Drawing, transform: string): string {
  return `<g transform="${transform}">${part.content()}</g>`;
}

/**
 * A limb's straight picture, bent at its middle joint, as two straight
 * halves: the lower one, then the upper one over it, with a round end at
 * the joint that covers the bend's outside, as the standing arm's halves
 * are. For limbs lying still: a strip of triangles (`bentSleeve`) shows
 * faint seams between them in an SVG. `start` is how far along the picture
 * it's attached (the shoulder joint, a hip).
 */
function jointedLimb(part: Drawing, pose: ArmPose, start = 0): string {
  const { shoulder, elbow, hand, upperArm } = pose;
  const id = `${part.prefix}-limb`;
  const joint = start + upperArm;
  const upperAngle = Math.atan2(elbow[1] - shoulder[1], elbow[0] - shoulder[0]);
  const lowerAngle = Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]);
  const deg = (angle: number) => n((angle * 180) / Math.PI);
  const radius = Math.max(-part.minY, part.maxY) * 0.85;
  const far = 9999;
  const upperClip = `${id}-u`;
  const lowerClip = `${id}-l`;
  return (
    `<defs><g id="${id}">${part.content(false)}</g>` +
    `<clipPath id="${upperClip}"><rect x="${-far}" y="${-far}" width="${n(far + joint)}" height="${far * 2}"/><circle cx="${n(joint)}" cy="0" r="${n(radius)}"/></clipPath>` +
    `<clipPath id="${lowerClip}"><rect x="${n(joint)}" y="${-far}" width="${far}" height="${far * 2}"/></clipPath></defs>` +
    `<g transform="translate(${n(elbow[0])} ${n(elbow[1])}) rotate(${deg(lowerAngle)}) translate(${n(-joint)} 0)"><g clip-path="url(#${lowerClip})"><use href="#${id}"/></g></g>` +
    `<g transform="translate(${n(shoulder[0])} ${n(shoulder[1])}) rotate(${deg(upperAngle)}) translate(${n(-start)} 0)"><g clip-path="url(#${upperClip})"><use href="#${id}"/></g></g>`
  );
}

/**
 * A sleeve's straight picture bent over an arm as `BodySprite` bends it
 * (`sleeveStrip`), drawn from the shoulder to the hand; or any limb's,
 * `start` along it from where it's attached (the shoulder joint, a hip).
 * `pixel` is how big a pixel is (mm).
 */
function bentSleeve(
  part: Drawing,
  pose: ArmPose,
  pixel: number,
  start = 0,
): string {
  const picture = {
    from: part.minX - start,
    to: part.maxX - start,
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
      start + picture.from + uvs[v * 2] * (picture.to - picture.from),
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
  const rest = hemRest(hem.shape, hemPictureAngles(hem.shape, angles));
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
  // Each strip (a flap either side of a vent), the right first, under the left
  for (const { from, to } of hemStrips(hem.shape, count)) {
    const end = closed ? to : to - 1;
    const after = (i: number) => (i + 1 === to ? from : i + 1);
    for (let r = 0; r < RINGS - 1; r++) {
      // Each ring's quads, from the waist out: the first triangle past the
      // diagonal, and the second past the next point's edge (but the last's,
      // which comes round to the first, or is the strip's end) and the
      // ring's edge further out
      const outer = r < RINGS - 2;
      for (let i = from; i < end; i++) {
        const last = i === end - 1;
        triangles.push([v(i, r), v(i, r + 1), v(after(i), r), [[1, 2]]]);
        triangles.push([
          v(i, r + 1),
          v(after(i), r),
          v(after(i), r + 1),
          [
            ...(last ? [] : [[1, 2] as [number, number]]),
            ...(outer ? [[0, 2] as [number, number]] : []),
          ],
        ]);
      }
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
    // Face down, in a pose a corpse might lie in (`lyingPose`, picked by
    // its seed): the legs, each bent at the knee, with its shoe, and the
    // seat over their tops; then the arms, bent at the elbow, and their
    // hands; then the top half over all that (the arms' round ends at the
    // shoulders hidden, as standing, and its hem over the legs), and the
    // head turned to one side
    const death = options.death ?? NO_DEATH;
    const legShape = lyingLegShape(body.look, dims);
    const pose = lyingPose(
      options.poseSeed === undefined
        ? lookRandom(body.look, 21)
        : makeRandom(options.poseSeed),
      {
        shoulder: lyingShoulder(dims),
        upperArm: dims.upperArm,
        forearm: dims.forearm,
        hipX: lyingWaist(dims) + legShape.drop,
        hipY: legShape.hip,
        thigh: legShape.thigh,
        shin: legShape.shin,
        headX: lyingHead(dims),
        headRadius: dims.headRx,
        handRadius: dims.handSize * 0.5,
      },
      death,
    );
    const legless = options.legless || death.missing.legs;
    const waist = -lyingWaist(dims);
    const shoulder = lyingShoulder(dims);
    const bare =
      body.look.pantsStyle === "shorts" || body.look.pantsStyle === "skirt";
    const corners: [number, number][] = [];
    if (!legless) {
      for (const side of [-1, 1] as const) {
        const i = side < 0 ? 0 : 1;
        const hip: [number, number] = [
          waist - legShape.drop,
          side * legShape.hip,
        ];
        const { middle, end, endAngle } = limbJoints(
          hip,
          pose.legs[i],
          legShape.thigh,
          legShape.shin,
        );
        const footAngle = ((endAngle + pose.feet[i]) * 180) / Math.PI;
        const shoe = place(
          parts.lyingShoe,
          `translate(${n(end[0])} ${n(end[1])}) rotate(${n(footAngle)}) scale(1 ${side})`,
        );
        const leg = jointedLimb(
          side < 0 ? parts.leftLyingLeg : parts.rightLyingLeg,
          {
            shoulder: hip,
            elbow: middle,
            hand: end,
            upperArm: legShape.thigh,
            forearm: legShape.shin,
            bend: 0,
          },
        );
        // The trouser leg over the top of the shoe; a bare leg under it
        items.push(...(bare ? [leg, shoe] : [shoe, leg]));
        const reach = legShape.thickness + 200;
        corners.push(
          [middle[0] - reach, middle[1] - reach],
          [middle[0] + reach, middle[1] + reach],
          [end[0] - reach, end[1] - reach],
          [end[0] + reach, end[1] + reach],
        );
      }
      items.push(place(parts.lyingSeat, `translate(${n(waist)} 0)`));
      corners.push(
        [waist + parts.lyingSeat.minX, parts.lyingSeat.minY],
        [waist + parts.lyingSeat.maxX, parts.lyingSeat.maxY],
      );
    }
    // Where something's come off, a stump
    const stump = (x: number, y: number, r: number) =>
      `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#5a0d0d"/>`;
    const stumps: string[] = [];
    for (const side of [-1, 1] as const) {
      const i = side < 0 ? 0 : 1;
      const at: [number, number] = [0, side * shoulder];
      if (side < 0 ? death.missing.leftArm : death.missing.rightArm) {
        stumps.push(stump(0, side * shoulder, dims.armThickness * 0.7));
        continue;
      }
      const { middle, end, endAngle } = limbJoints(
        at,
        pose.arms[i],
        dims.upperArm,
        dims.forearm,
      );
      items.push(
        jointedLimb(
          side < 0 ? parts.leftArm : parts.rightArm,
          {
            shoulder: at,
            elbow: middle,
            hand: end,
            upperArm: dims.upperArm,
            forearm: dims.forearm,
            bend: 0,
          },
          armShoulderJoint(dims),
        ),
        place(
          side < 0 ? parts.leftFlatHand : parts.rightFlatHand,
          `translate(${n(end[0])} ${n(end[1])}) rotate(${n((endAngle * 180) / Math.PI)})`,
        ),
      );
      const reach = dims.handSize + dims.armThickness;
      corners.push(
        [middle[0] - reach, middle[1] - reach],
        [middle[0] + reach, middle[1] + reach],
        [end[0] - reach, end[1] - reach],
        [end[0] + reach, end[1] + reach],
      );
    }
    // Whole, or torn off at the waist without its legs
    const torso = legless ? parts.lyingTorso : parts.lyingTop;
    items.push(place(torso, ""), ...stumps);
    corners.push([torso.minX, torso.minY], [torso.maxX, torso.maxY]);
    const headAt = lyingHead(dims);
    const head = parts.turnedHead;
    items.push(
      death.missing.head
        ? stump(headAt * 0.5, 0, dims.headRy * 0.7)
        : place(
            head,
            `translate(${n(headAt)} 0) rotate(${n((pose.head.angle * 180) / Math.PI)}) scale(1 ${pose.head.facesLeft ? -1 : 1})`,
          ),
    );
    const headReach = Math.max(
      Math.abs(head.minX),
      Math.abs(head.maxX),
      Math.abs(head.minY),
      Math.abs(head.maxY),
    );
    corners.push(
      [headAt - headReach, -headReach],
      [headAt + headReach, headReach],
    );
    box = [
      Math.min(...corners.map(([x]) => x)),
      Math.min(...corners.map(([, y]) => y)),
      Math.max(...corners.map(([x]) => x)),
      Math.max(...corners.map(([, y]) => y)),
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

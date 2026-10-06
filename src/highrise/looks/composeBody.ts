import { elbowPosition } from "../creature-stuff/armReach";
import { STYLE } from "./style";
import { FOOT_FORWARD, HEM_OVERLAP, HIP_WIDTH } from "../creature-stuff/Legs";
import { BodyLook, PartialLook } from "./BodyLook";
import { BodyDrawing, BodyLayer, drawBody, LAYER_PARTS } from "./drawBody";
import { Drawing, n } from "./svg";
import { lyingWaist } from "./parts/torso";
import { armHandPosition } from "./parts/limbs";

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
    );
    box = [
      Math.min(
        -stride - 200,
        parts.torso.minX,
        parts.head.minX,
        ...dangleCorners.map(([x]) => x),
      ),
      -reach,
      Math.max(
        420,
        parts.torso.maxX,
        parts.head.maxX,
        ...hands.map(([hx]) => hx + dims.handSize * 0.6),
        ...dangleCorners.map(([x]) => x),
      ),
      reach,
    ];
  } else {
    // Face down: the legs, the top half, arms by its sides and the head
    const shoulder = dims.shoulderHalfWidth - dims.armThickness / 2;
    const waist = -lyingWaist(dims);
    const handAt = armHandPosition(dims);
    // The legs over the torn end, as a corpse has them
    items.push(place(parts.lyingTorso, ""));
    if (!options.legless) {
      items.push(place(parts.lyingLegs, `translate(${n(waist)} 0)`));
    }
    for (const [arm, hand, side] of [
      [parts.leftArm, parts.leftHand, -1],
      [parts.rightArm, parts.rightHand, 1],
    ] as const) {
      const angle = side * 150;
      items.push(
        place(
          arm,
          `translate(0 ${n(side * shoulder)}) rotate(${angle}) scale(0.75 1)`,
        ),
      );
      const rad = (angle * Math.PI) / 180;
      items.push(
        place(
          hand,
          `translate(${n(Math.cos(rad) * handAt * 0.75)} ${n(side * shoulder + Math.sin(rad) * handAt * 0.75)})`,
        ),
      );
    }
    items.push(place(parts.lyingHead, `translate(${n(dims.headRx * 0.55)} 0)`));
    // Out to the hands, at the ends of the arms
    const handOut = shoulder + Math.sin((150 * Math.PI) / 180) * handAt * 0.75;
    const reach = Math.max(
      dims.shoulderHalfWidth + 120,
      handOut + dims.handSize * 0.6,
      parts.lyingLegs.maxY,
    );
    box = [
      options.legless ? parts.lyingTorso.minX : waist + parts.lyingLegs.minX,
      -reach,
      dims.headRx * 0.55 + parts.lyingHead.maxX,
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

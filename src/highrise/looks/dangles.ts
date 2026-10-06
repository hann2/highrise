import { Drawing, hungFrom, Pt } from "./svg";

/** The things on a body that swing as it moves, each drawn as a part of its own */
export const DANGLE_KINDS = [
  "ponytail",
  "lanyard",
  "tie",
  "scarf",
  "backpack",
] as const;
export type DangleKind = (typeof DANGLE_KINDS)[number];

/**
 * Something hanging off the head or the torso, drawn on its own so it can
 * swing (see `BodySprite`): turned so it hangs along +x from its pivot at
 * the origin
 */
export interface DangleDrawing {
  kind: DangleKind;
  /** The part it hangs off */
  on: "head" | "torso";
  drawing: Drawing;
  /** Where it hangs from on that part (mm), and which way it hangs */
  pivot: Pt;
  angle: number;
  /** From the pivot to its tip (mm) */
  length: number;
}

/**
 * `drawing`, drawn where it is on the part it hangs off, as a dangle hanging
 * from `pivot` toward `tip`
 */
export function hang(
  kind: DangleKind,
  on: "head" | "torso",
  drawing: Drawing,
  pivot: Pt,
  tip: Pt,
): DangleDrawing {
  const angle = Math.atan2(tip[1] - pivot[1], tip[0] - pivot[0]);
  return {
    kind,
    on,
    drawing: hungFrom(drawing, pivot, angle),
    pivot,
    angle,
    length: Math.hypot(tip[0] - pivot[0], tip[1] - pivot[1]),
  };
}

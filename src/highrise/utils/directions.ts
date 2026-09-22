import { V, V2d } from "../../core/Vector";

export const Direction = {
  RIGHT: V(1, 0),
  DOWN: V(0, 1),
  LEFT: V(-1, 0),
  UP: V(0, -1),
  RIGHTUP: V(1, -1),
  RIGHTDOWN: V(1, 1),
  LEFTUP: V(-1, -1),
  LEFTDOWN: V(-1, 1),
} as const satisfies Record<string, V2d>;

export type DirectionName = keyof typeof Direction;
export type CardinalDirection = "RIGHT" | "DOWN" | "LEFT" | "UP";
export type DiagonalDirection = Exclude<DirectionName, CardinalDirection>;

export const DIAGONAL_DIRECTIONS: readonly DiagonalDirection[] = [
  "RIGHTUP",
  "RIGHTDOWN",
  "LEFTUP",
  "LEFTDOWN",
];

export const CARDINAL_DIRECTIONS: readonly CardinalDirection[] = [
  "RIGHT",
  "DOWN",
  "LEFT",
  "UP",
];

export const CARDINAL_DIRECTIONS_VALUES: V2d[] = CARDINAL_DIRECTIONS.map(
  (d) => Direction[d],
);

export function vectorToId(v1: V2d): DirectionName {
  for (const [direction, v2] of Object.entries(Direction)) {
    if (v1.equals(v2)) {
      return direction as DirectionName;
    }
  }
  throw new Error("Not a cardinal direction! " + v1.toString());
}

export function decomposeDiagonal(direction: DirectionName): DirectionName[] {
  const vec = Direction[direction];
  const xComponent = V(vec.x, 0);
  const yComponent = V(0, vec.y);
  return [vectorToId(xComponent), vectorToId(yComponent)];
}

export function opposite<D extends DirectionName>(direction: D): D {
  return vectorToId(Direction[direction].negate()) as D;
}

export function isCardinal(
  direction: DirectionName,
): direction is CardinalDirection {
  return (CARDINAL_DIRECTIONS as readonly string[]).includes(direction);
}

export function isDiagonal(
  direction: DirectionName,
): direction is DiagonalDirection {
  return (DIAGONAL_DIRECTIONS as readonly string[]).includes(direction);
}

import { V, V2d } from "../../core/Vector";

export const Direction: Record<string, V2d> = {
  RIGHT: V(1, 0),
  DOWN: V(0, 1),
  LEFT: V(-1, 0),
  UP: V(0, -1),
  RIGHTUP: V(1, -1),
  RIGHTDOWN: V(1, 1),
  LEFTUP: V(-1, -1),
  LEFTDOWN: V(-1, 1),
};

export const DIAGONAL_DIRECTIONS: (keyof typeof Direction)[] = [
  "RIGHTUP",
  "RIGHTDOWN",
  "LEFTUP",
  "LEFTDOWN",
];

export const CARDINAL_DIRECTIONS: (keyof typeof Direction)[] = [
  "RIGHT",
  "DOWN",
  "LEFT",
  "UP",
];

export const CARDINAL_DIRECTIONS_VALUES: V2d[] = CARDINAL_DIRECTIONS.map(
  (d) => Direction[d]
);

export function vectorToId(v1: V2d): keyof typeof Direction {
  for (const direction in Direction) {
    const v2 = Direction[direction];
    if (v1.x === v2.x && v1.y === v2.y) {
      return direction;
    }
  }
  throw new Error("Not a cardinal direction! " + v1.toString());
}

export function decomposeDiagonal(
  direction: keyof typeof Direction
): (keyof typeof Direction)[] {
  const vec = Direction[direction];
  const xComponent = V(vec.x, 0);
  const yComponent = V(0, vec.y);
  return [vectorToId(xComponent), vectorToId(yComponent)];
}

export function opposite(
  direction: keyof typeof Direction
): keyof typeof Direction {
  const vec = Direction[direction];
  return vectorToId(vec.mul(-1));
}

export function isCardinal(direction: keyof typeof Direction): boolean {
  return CARDINAL_DIRECTIONS.indexOf(direction) !== -1;
}

export function isDiagnoal(direction: keyof typeof Direction): boolean {
  return DIAGONAL_DIRECTIONS.indexOf(direction) !== -1;
}

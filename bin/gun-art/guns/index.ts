/** Every gun drawn by a generator. Add a gun's drawing here, and `build` writes its pickup. */
import type { GunDrawing } from "../lib/gun";
import { DESERT_EAGLE } from "./desert-eagle";
import { FIVE_SEVEN } from "./five-seven";
import { GLOCK } from "./glock";
import { M1911 } from "./m1911";
import { REVOLVER } from "./revolver";

export const GUNS: readonly GunDrawing<any>[] = [
  M1911,
  GLOCK,
  FIVE_SEVEN,
  DESERT_EAGLE,
  REVOLVER,
];

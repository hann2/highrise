/** Every gun drawn by a generator. Add a gun's drawing here, and `build` writes its pickup. */
import type { GunDrawing } from "../lib/gun";
import { DESERT_EAGLE } from "./desert-eagle";
import { FIVE_SEVEN } from "./five-seven";
import { GLOCK } from "./glock";
import { M1911 } from "./m1911";
import { REVOLVER } from "./revolver";
import { AK_47 } from "./ak-47";
import { P90 } from "./p90";
import { REMINGTON_870 } from "./remington-870";
import { SPAS_12 } from "./spas-12";
import { DOUBLE_BARREL_SHOTGUN } from "./double-barrel-shotgun";

export const GUNS: readonly GunDrawing<any>[] = [
  M1911,
  GLOCK,
  FIVE_SEVEN,
  DESERT_EAGLE,
  REVOLVER,
  AK_47,
  P90,
  REMINGTON_870,
  SPAS_12,
  DOUBLE_BARREL_SHOTGUN,
];

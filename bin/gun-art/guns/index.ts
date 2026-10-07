/** Every gun drawn by a generator. Add a gun's drawing here, and `build` writes its pickup. */
import type { GunDrawing } from "../lib/gun";
import { M1911 } from "./m1911";

export const GUNS: readonly GunDrawing<any>[] = [M1911];

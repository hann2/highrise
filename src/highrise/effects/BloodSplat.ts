import type Game from "../../core/Game";
import { darken } from "../../core/util/ColorUtils";
import { choose, rUniform } from "../../core/util/Random";
import { BLOOD_COLOR, getFloorStains } from "./FloorStains";
import { SPLAT_TEXTURES } from "./Splat";

/** Meters across a splat of size 1 */
const SIZE = 2;
/** Seconds it's wet enough to track in footprints, drying all the while */
export const SPLAT_WET_TIME = 30;
/** How much of the splat's width, from its middle, shoes pick it up in: the middle's solid, the edges ragged */
export const WET_RADIUS = 0.42;

/**
 * Splats blood on the floor: painted into the floor's stains
 * (`FloorStains`), so it stays for the floor and costs nothing to draw, and
 * wet for a while (`SPLAT_WET_TIME`), for shoes to track.
 */
export function splatBlood(
  game: Game,
  [x, y]: [number, number],
  size: number = 1,
) {
  const width = size * SIZE;
  const stains = getFloorStains(game);
  stains.stamp({
    image: choose(...SPLAT_TEXTURES),
    position: [x, y],
    angle: rUniform(0, Math.PI / 2),
    length: width,
    width,
    mirror: false,
    color: darken(0xff0000, rUniform(0.1, 0.4)),
    alpha: 0.9,
  });
  stains.spill([x, y], width * WET_RADIUS, BLOOD_COLOR, 1, SPLAT_WET_TIME);
}

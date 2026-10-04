import type { FootLanding } from "../../core/animation/Gait";
import type { Stamp } from "../effects/FloorStains";
import type { Spill } from "../effects/SpillGrid";
import { FOOT_FORWARD, FOOT_LENGTH, FOOT_WIDTH } from "./Legs";

/** Stepping in this much of a spill (see `FloorStains.spill`) or more wets the shoe */
const WETTING_AMOUNT = 0.3;
/** How many prints a soaked shoe leaves before it's clean */
export const PRINTS = 10;
/** How dark a soaked shoe's first print is */
const PRINT_ALPHA = 1;
/** How much the other shoe picks up when one steps in something, as a share */
export const OTHER_SHOE = 0.6;

/** What shoes step in and leave prints on: `FloorStains` */
export interface StainedFloor {
  spillAt(position: [number, number]): Spill | undefined;
  stamp(stamp: Stamp): void;
}

/** What one shoe has on its sole */
interface Sole {
  /** How much: 1 is soaked, 0 clean */
  amount: number;
  color: number;
}

/**
 * A body's shoes: stepping in something spilled on the floor (blood) wets
 * that sole, and the other a bit less (`OTHER_SHOE`), and the steps after
 * that leave prints of it, fainter each step until it's worn off (`PRINTS`).
 * `land` is called as each foot comes down (`Gait.onLand`, which only
 * happens for bodies in view).
 */
export class Shoes {
  private soles: [Sole, Sole] = [
    { amount: 0, color: 0 },
    { amount: 0, color: 0 },
  ];

  /** `scale` is how big the feet are next to a human's */
  constructor(private scale: number) {}

  /**
   * A foot coming down on `floor`: the floor's stains, if anything's been
   * spilled on it yet, else made by `makeFloor` if there's a print to leave
   */
  land(
    { side, position, angle }: FootLanding,
    floor: StainedFloor | undefined,
    makeFloor: () => StainedFloor,
  ) {
    const sole = this.soles[side];
    // Nothing spilled on this floor, and nothing on the shoe: nothing to do
    if (!floor && sole.amount <= 0) {
      return;
    }
    const stains = floor ?? makeFloor();
    // The middle of the sole, ahead of the ankle
    const forward = FOOT_FORWARD * this.scale;
    const center: [number, number] = [
      position[0] + Math.cos(angle) * forward,
      position[1] + Math.sin(angle) * forward,
    ];

    const spill = stains.spillAt(center);
    if (spill && spill.amount >= WETTING_AMOUNT) {
      // In it: no print shows in the puddle, but the shoe comes out soaked,
      // and the other gets some too, wading through
      sole.amount = Math.max(sole.amount, spill.amount);
      sole.color = spill.color;
      const other = this.soles[side === 0 ? 1 : 0];
      if (other.amount < spill.amount * OTHER_SHOE) {
        other.amount = spill.amount * OTHER_SHOE;
        other.color = spill.color;
      }
      return;
    }
    if (sole.amount <= 0) {
      return;
    }
    stains.stamp({
      image: "footprint",
      position: center,
      angle,
      length: FOOT_LENGTH * this.scale,
      width: FOOT_WIDTH * this.scale,
      mirror: side === 0,
      color: sole.color,
      alpha: PRINT_ALPHA * sole.amount,
    });
    // Clean after `PRINTS` prints from soaked (a little over, for rounding)
    sole.amount = Math.max(0, sole.amount - 1 / PRINTS - 1e-9);
  }

  /** How much is on each sole, 0 to 1: the left and the right */
  get wetness(): [number, number] {
    return [this.soles[0].amount, this.soles[1].amount];
  }
}

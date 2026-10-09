import { V, V2d } from "../../../core/Vector";
import Decoration from "../../environment/Decoration";
import {
  boxPile1,
  boxPile2,
  cementFloor,
  transformer,
} from "../../environment/decorations/decorations";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import BossFight from "../BossFight";
import { SurviveGoal } from "../BossGoal";
import BossLevel, { BossDebugAction } from "../BossLevel";
import BossLevelBuilder from "../BossLevelBuilder";
import Horde from "./Horde";

/** The dock, in cells (`CELL_SIZE` meters); its top and bottom rows are wall but for the bays */
const DOCK = V(11, 8);
/** The loading bays in the dock's top and bottom walls, where the horde comes in */
const BAY_COLUMNS = [4, 7, 10];
/** Seconds to hold out */
const HOLD_OUT = 60;

/**
 * A siege: the loading dock, where a horde pours in through the loading bays
 * along both walls, faster and nastier as the time runs out, and the
 * stairwell opens once the time's up. Crates and the transformer are cover.
 */
export default class HordeLevel extends BossLevel {
  static id = "horde";
  static floorName = "Loading Dock";
  static floorNotes = ["Boss"];

  private goal?: SurviveGoal;

  getSize(): [number, number] {
    return BossLevelBuilder.hallLevelSize(DOCK);
  }

  makeSubfloor(size: [number, number]) {
    return new RepeatingFloor(cementFloor, [0, 0], size);
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x1a1a1e);
  }

  layOut(builder: BossLevelBuilder) {
    // Wall along the top and bottom rows, but for the bays
    const walls: V2d[] = [];
    for (let x = 0; x < DOCK.x; x++) {
      if (!BAY_COLUMNS.includes(x)) {
        walls.push(V(x, 0), V(x, DOCK.y - 1));
      }
    }
    const dock = builder.addHall(this.arrivalRoom(), DOCK, walls);

    // Cover: the transformer in the middle, crates about
    builder.add(new Decoration(dock.at(V(5.5, 3.5)), transformer));
    for (const [cell, info, angle] of [
      [V(2.5, 1.6), boxPile1, 0],
      [V(8.5, 5.4), boxPile2, Math.PI],
      [V(8, 2), boxPile2, 0.3],
      [V(3, 5.5), boxPile1, -0.4],
    ] as const) {
      builder.add(new Decoration(dock.at(cell), info, angle));
    }

    for (const x of [1.5, 5, 8.5]) {
      for (const y of [2, 5]) {
        builder.add(
          new OverheadLight(dock.at(V(x, y)), { radius: 8, intensity: 0.7 }),
        );
      }
    }
    // A light in each bay, so you see them coming
    const bays = BAY_COLUMNS.flatMap((x) => [
      dock.at(V(x, 0)),
      dock.at(V(x, DOCK.y - 1)),
    ]);
    for (const bay of bays) {
      builder.add(
        new OverheadLight(bay, {
          radius: 3,
          intensity: 0.5,
          color: 0xffbb77,
        }),
      );
    }

    const goal = new SurviveGoal(HOLD_OUT, dock.at(V(3.5, 3.5)));
    this.goal = goal;
    builder.add(new BossFight("The Horde", goal), new Horde(bays, goal));
  }

  debugActions(): BossDebugAction[] {
    return [
      {
        label: "Skip to 10 s left",
        run: () => {
          if (this.goal) {
            this.goal.timeLeft = Math.min(this.goal.timeLeft, 10);
          }
        },
      },
    ];
  }
}

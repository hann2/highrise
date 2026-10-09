import { V } from "../../../core/Vector";
import Necromancer from "../../enemies/necromancer/Necromancer";
import Decoration from "../../environment/Decoration";
import { cementFloor, rug } from "../../environment/decorations/decorations";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import BossFight from "../BossFight";
import { killBosses } from "../BossGoal";
import BossLevel from "../BossLevel";
import BossLevelBuilder from "../BossLevelBuilder";
import { redCarpet } from "./redCarpet";

/** The chapel's layout, in cells (`CELL_SIZE` meters) */
const SIZE = V(14, 8);
/** The arrival room, 3 by 3, on the left; its door lets out at (3, 2) */
const ARRIVAL = V(0, 2);
/** The chapel itself, between the arrival room and the stairwell */
const NAVE_MIN = V(3, 0);
const NAVE_SIZE = V(9, 8);
/** The stairwell, behind the nave on the right, its door into the nave */
const STAIRWELL = V(12, 3);
/** The carpet down the middle, and where the Necromancer waits on it */
const CARPET_MIN = V(5, 2);
const CARPET_SIZE = V(5, 4);
const NECROMANCER_START = V(9, 3.5);

/**
 * The Necromancer's chapel: a long hall with a red carpet, the arrival room
 * at one end and the stairwell behind the far end. The Necromancer keeps its
 * distance, moving between the hall's thirds, and fights with orbs, phlegm
 * and zombies hatched from eggs.
 */
export default class NecromancerLevel extends BossLevel {
  static id = "necromancer";
  static floorName = "Chapel";

  getSize(): [number, number] {
    return [SIZE.x, SIZE.y];
  }

  makeSubfloor(size: [number, number]) {
    return new RepeatingFloor(cementFloor, [0, 0], size);
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x222227);
  }

  layOut(builder: BossLevelBuilder) {
    const cells = BossLevelBuilder.cellsIn;
    // The nave first, so the stairwell's walls go back up around it
    builder.open(cells(NAVE_MIN, NAVE_SIZE));
    builder.addArrivalRoom(this.arrivalRoom(), ARRIVAL);
    builder.addExitStairwell(STAIRWELL, "left");
    // The corners nobody goes in are solid, rather than rooms of their own
    builder.open(cells(V(0, 0), V(3, 2)));
    builder.open(cells(V(0, 5), V(3, 3)));
    builder.open(cells(V(12, 0), V(2, 3)));
    builder.open(cells(V(12, 5), V(2, 3)));

    builder.add(
      redCarpet(builder.cellToWorld(CARPET_MIN.sub(V(0.5, 0.5))), CARPET_SIZE),
    );
    const start = builder.cellToWorld(NECROMANCER_START);
    builder.add(new Decoration(start, rug));

    for (const x of [4.5, 7.5, 10.5]) {
      for (const y of [1.5, 5.5]) {
        builder.add(
          new OverheadLight(builder.cellToWorld(V(x, y)), {
            radius: 9,
            intensity: 0.8,
          }),
        );
      }
    }

    const nave = builder.cellsToWorld(NAVE_MIN, NAVE_SIZE);
    const necromancer = new Necromancer(
      start,
      nave.min,
      nave.max.sub(nave.min),
    );
    builder.add(
      necromancer,
      new BossFight("The Necromancer", killBosses([necromancer])),
    );
  }
}

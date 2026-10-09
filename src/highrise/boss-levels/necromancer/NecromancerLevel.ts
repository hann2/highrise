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

/** The chapel's nave, in cells (`CELL_SIZE` meters) */
const NAVE = V(9, 8);
/** The carpet down the middle, and where the Necromancer waits on it (in the nave's cells) */
const CARPET_MIN = V(2, 2);
const CARPET_SIZE = V(5, 4);
const NECROMANCER_START = V(6, 3.5);

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
    return BossLevelBuilder.hallLevelSize(NAVE);
  }

  makeSubfloor(size: [number, number]) {
    return new RepeatingFloor(cementFloor, [0, 0], size);
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x222227);
  }

  layOut(builder: BossLevelBuilder) {
    const nave = builder.addHall(this.arrivalRoom(), NAVE);

    builder.add(redCarpet(nave.at(CARPET_MIN.sub(V(0.5, 0.5))), CARPET_SIZE));
    const start = nave.at(NECROMANCER_START);
    builder.add(new Decoration(start, rug));

    for (const x of [1.5, 4.5, 7.5]) {
      for (const y of [1.5, 5.5]) {
        builder.add(
          new OverheadLight(nave.at(V(x, y)), { radius: 9, intensity: 0.8 }),
        );
      }
    }

    const necromancer = new Necromancer(
      start,
      nave.world.min,
      nave.world.max.sub(nave.world.min),
    );
    builder.add(
      necromancer,
      new BossFight("The Necromancer", killBosses([necromancer])),
    );
  }
}

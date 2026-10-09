import { V } from "../../../core/Vector";
import { marbleFloor1 } from "../../environment/decorations/decorations";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import BossFight from "../BossFight";
import { killBosses } from "../BossGoal";
import BossLevel, { BossDebugAction } from "../BossLevel";
import BossLevelBuilder from "../BossLevelBuilder";
import Behemoth from "./Behemoth";

/** The penthouse's hall, in cells (`CELL_SIZE` meters) */
const HALL = V(12, 9);
/** Pillars to dodge round, and to make it charge into */
const PILLARS = [V(3, 2), V(3, 6), V(8, 2), V(8, 6)];

/**
 * The final boss, for now: the Behemoth, in the penthouse, a wide marble
 * hall with four pillars. Get it to charge into one and it's dazed for a
 * while.
 */
export default class BehemothLevel extends BossLevel {
  static id = "behemoth";
  static floorName = "Penthouse";
  static floorNotes = ["Boss"];

  private behemoth?: Behemoth;

  getSize(): [number, number] {
    return BossLevelBuilder.hallLevelSize(HALL);
  }

  makeSubfloor(size: [number, number]) {
    return new RepeatingFloor(marbleFloor1, [0, 0], size);
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x202024);
  }

  layOut(builder: BossLevelBuilder) {
    const hall = builder.addHall(this.arrivalRoom(), HALL, PILLARS);

    for (const x of [1, 5.5, 10]) {
      for (const y of [1, 4, 7]) {
        builder.add(
          new OverheadLight(hall.at(V(x, y)), { radius: 8, intensity: 0.75 }),
        );
      }
    }

    // Facing the way you come in
    const behemoth = new Behemoth(hall.at(V(9.5, 4)), Math.PI);
    this.behemoth = behemoth;
    builder.add(
      behemoth,
      new BossFight("The Behemoth", killBosses([behemoth])),
    );
  }

  debugActions(): BossDebugAction[] {
    return [
      {
        label: "Charge now",
        run: () => this.behemoth?.controller.chargeNow(),
      },
    ];
  }
}

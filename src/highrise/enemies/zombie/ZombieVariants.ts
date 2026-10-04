import { makeRandom } from "../../../core/util/Random";
import {
  KEVIN_ZOMBIE_SOUNDS,
  RACHEL_ZOMBIE_SOUNDS,
} from "../../constants/constants";
import { BodyLook } from "../../looks/BodyLook";
import { BodyAppearance, getAppearance } from "../../looks/bakeBodies";
import { randomLook } from "../../looks/randomLook";
import { EnemySounds } from "../base/EnemyVoice";

/** How many different zombies there are to meet; each is baked at boot */
const ZOMBIE_LOOK_COUNT = 48;
/** The same zombies every time, whatever the run's seed */
const ZOMBIE_LOOK_SEED = 20261004;

/**
 * The zombies' looks: random people from the building, made with their own
 * generator so they're the same every time and don't touch the seeded one
 */
export const ZOMBIE_LOOKS: BodyLook[] = (() => {
  const random = makeRandom(ZOMBIE_LOOK_SEED);
  return Array.from({ length: ZOMBIE_LOOK_COUNT }, () =>
    randomLook(random, true),
  );
})();

export class ZombieVariant {
  constructor(
    readonly look: BodyLook,
    readonly sounds: EnemySounds,
  ) {}

  /** Its textures, which are baked at boot */
  get body(): BodyAppearance {
    return getAppearance(this.look);
  }
}

export const ZOMBIE_VARIANTS: ZombieVariant[] = ZOMBIE_LOOKS.map(
  (look) => new ZombieVariant(look, RACHEL_ZOMBIE_SOUNDS),
);

export const SPRINTER_VARIANTS: ZombieVariant[] = ZOMBIE_LOOKS.map(
  (look) => new ZombieVariant(look, KEVIN_ZOMBIE_SOUNDS),
);

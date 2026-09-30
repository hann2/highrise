import { V2d } from "../../../core/Vector";

export type BlowKind =
  "bullet" | "melee" | "explosion" | "push" | "burn" | "other";

/** What killed an enemy, which decides how it comes apart */
export interface DeathBlow {
  kind: BlowKind;
  /** Damage from the blow plus what it took just before, so a shotgun's pellets add up */
  damage: number;
  /** Where it was hit, in the world */
  position?: V2d;
  /** Which way the blow was going, as a unit vector */
  direction?: V2d;
}

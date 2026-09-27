import { FragGrenade } from "../weapons/consumables/consumable-stats/FragGrenade";
import { ConsumableStats } from "../weapons/consumables/ConsumableStats";

/** What an Exploding Rounds hit goes off as: a very small grenade */
export const EXPLODING_ROUND: ConsumableStats = {
  ...FragGrenade,
  name: "Exploding Round",
  damage: 30,
  damageRadius: 1,
  knockback: 60,
  stunRadius: 0,
  stunDuration: 0,
  flash: { radius: 3, color: 0xffb060, intensity: 1, duration: 0.2 },
  blastRing: { radius: 1, color: 0xffa040 },
  sounds: {
    detonate: [{ name: "shotgunShot1", speed: 0.8, gain: 0.5 }],
    bounce: [],
  },
};

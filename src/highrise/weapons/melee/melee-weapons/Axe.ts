import { degToRad } from "../../../../core/util/MathUtil";
import { defaultMeleeWeapon, MeleeWeaponStats } from "../MeleeWeaponStats";

export const Axe: MeleeWeaponStats = {
  ...defaultMeleeWeapon,

  name: "Axe",

  damage: 80,
  windUpDamage: 20,

  knockbackAmount: 50,
  windUpKnockbackAmount: 50,

  size: [0.2, 1],
  pivotPosition: [0.5, 0.85],

  swing: {
    durations: [0.25, 0.2, 0.2],
    angles: [degToRad(-75), degToRad(60), degToRad(-90)],
    maxExtension: 0.2,
    restPosition: [0.15, 0.4],
    swingCenter: [0.0, 0.0],
  },

  textures: {
    pickup: "axe",
    attack: "axe",
    hold: "axe",
  },

  sounds: {
    ...defaultMeleeWeapon.sounds,
    swing: ["swordSwoosh2", "swordSwoosh3"],
    windup: ["swordSwoosh1"],
    hitFlesh: ["fleshHit4"],
    pickup: ["swordShing3"],
  },
};

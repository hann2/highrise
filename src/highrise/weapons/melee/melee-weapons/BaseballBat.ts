import { degToRad } from "../../../../core/util/MathUtil";
import { defaultMeleeWeapon, MeleeWeaponStats } from "../MeleeWeaponStats";

export const BaseballBat: MeleeWeaponStats = {
  ...defaultMeleeWeapon,

  name: "Baseball Bat",

  damage: 50,
  knockbackAmount: 140,
  windUpKnockbackAmount: 60,

  size: [0.2, 1],
  pivotPosition: [0.5, 0.9],

  swing: {
    durations: [0.1, 0.18, 0.2],
    angles: [degToRad(120), degToRad(140), degToRad(-75)],
    maxExtension: 0.6,
    restPosition: [0.2, 0.2],
    swingCenter: [0.0, 0.0],
  },

  textures: {
    pickup: "baseballBatPickup",
    attack: "baseballBatPickup",
    hold: "baseballBatHold",
  },

  sounds: {
    ...defaultMeleeWeapon.sounds,
    swing: ["swordSwoosh1", "swordSwoosh2", "swordSwoosh3"],
    hitFlesh: ["fleshHitBat1", "fleshHitBat2"],
    pickup: ["baseballBatPickup1", "baseballBatPickup2"],
  },
};

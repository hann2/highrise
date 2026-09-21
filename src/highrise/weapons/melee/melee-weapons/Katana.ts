import { degToRad } from "../../../../core/util/MathUtil";
import { defaultMeleeWeapon, MeleeWeaponStats } from "../MeleeWeaponStats";

export const Katana: MeleeWeaponStats = {
  ...defaultMeleeWeapon,

  name: "Katana",

  damage: 50,
  windDownDamage: 30,
  windUpKnockbackAmount: 20,
  knockbackAmount: 50,
  windDownKnockbackAmount: 45,

  size: [0.2, 1],
  pivotPosition: [0.5, 0.85],

  swing: {
    durations: [0.08, 0.17, 0.2],
    angles: [degToRad(110), degToRad(140), degToRad(-75)],
    maxExtension: 0.6,
    restPosition: [0.1, 0.2],
    swingCenter: [0.0, 0.0],
  },

  textures: {
    pickup: "katana",
    attack: "katana",
    hold: "katana",
  },

  sounds: {
    ...defaultMeleeWeapon.sounds,
    swing: ["swordSwoosh1", "swordSwoosh2", "swordSwoosh3"],
    hitFlesh: ["fleshHit1", "fleshHit2", "fleshHit3", "fleshHit4"],
    pickup: ["swordShing2"],
  },
};

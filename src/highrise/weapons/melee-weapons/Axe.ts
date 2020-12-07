import swordShing3 from "../../../../resources/audio/weapons/sword-shing-3.flac";
import swordSwoosh1 from "../../../../resources/audio/weapons/sword-swoosh-1.flac";
import swordSwoosh2 from "../../../../resources/audio/weapons/sword-swoosh-2.flac";
import swordSwoosh3 from "../../../../resources/audio/weapons/sword-swoosh-3.flac";
import axe from "../../../../resources/images/weapons/axe.png";
import { degToRad } from "../../../core/util/MathUtil";
import { defaultMeleeWeapon, MeleeWeaponStats } from "../MeleeWeaponStats";

export const Axe: MeleeWeaponStats = {
  ...defaultMeleeWeapon,

  name: "Axe",

  damage: 80,
  windUpDamage: 20,

  knockbackAmount: 80,
  windUpKnockbackAmount: 40,

  size: [0.2, 1],
  handlePosition: [0.5, 0.85],

  swing: {
    durations: [0.25, 0.2, 0.2],
    angles: [degToRad(-75), degToRad(60), degToRad(-90)],
    maxExtension: 0.2,
    restPosition: [0.15, 0.4],
    swingCenter: [0.0, 0.0],
  },

  textures: {
    pickup: axe,
    attack: axe,
    hold: axe,
  },

  sounds: {
    ...defaultMeleeWeapon.sounds,
    swing: [swordSwoosh2, swordSwoosh3],
    windup: [swordSwoosh1],
    pickup: [swordShing3],
  },
};

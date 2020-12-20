import snd_fleshHit4 from "../../../../../resources/audio/impacts/flesh-hit-4.flac";
import snd_swordShing3 from "../../../../../resources/audio/weapons/sword-shing-3.flac";
import snd_swordSwoosh1 from "../../../../../resources/audio/weapons/sword-swoosh-1.flac";
import snd_swordSwoosh2 from "../../../../../resources/audio/weapons/sword-swoosh-2.flac";
import snd_swordSwoosh3 from "../../../../../resources/audio/weapons/sword-swoosh-3.flac";
import img_axe from "../../../../../resources/images/weapons/axe.png";
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
  handlePosition: [0.5, 0.85],

  swing: {
    durations: [0.25, 0.2, 0.2],
    angles: [degToRad(-75), degToRad(60), degToRad(-90)],
    maxExtension: 0.2,
    restPosition: [0.15, 0.4],
    swingCenter: [0.0, 0.0],
  },

  textures: {
    pickup: img_axe,
    attack: img_axe,
    hold: img_axe,
  },

  sounds: {
    ...defaultMeleeWeapon.sounds,
    swing: [snd_swordSwoosh2, snd_swordSwoosh3],
    windup: [snd_swordSwoosh1],
    hitFlesh: [snd_fleshHit4],
    pickup: [snd_swordShing3],
  },
};

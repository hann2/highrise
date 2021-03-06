import snd_fleshHitBat1 from "../../../../../resources/audio/impacts/flesh-hit-bat-1.flac";
import snd_fleshHitBat2 from "../../../../../resources/audio/impacts/flesh-hit-bat-2.flac";
import snd_baseballBatPickup1 from "../../../../../resources/audio/weapons/baseball-bat-pickup-1.flac";
import snd_baseballBatPickup2 from "../../../../../resources/audio/weapons/baseball-bat-pickup-2.flac";
import snd_swordSwoosh1 from "../../../../../resources/audio/weapons/sword-swoosh-1.flac";
import snd_swordSwoosh2 from "../../../../../resources/audio/weapons/sword-swoosh-2.flac";
import snd_swordSwoosh3 from "../../../../../resources/audio/weapons/sword-swoosh-3.flac";
import img_baseballBatHold from "../../../../../resources/images/weapons/baseball-bat-hold.png";
import img_baseballBatPickup from "../../../../../resources/images/weapons/baseball-bat-pickup.png";
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
    pickup: img_baseballBatPickup,
    attack: img_baseballBatPickup,
    hold: img_baseballBatHold,
  },

  sounds: {
    ...defaultMeleeWeapon.sounds,
    swing: [snd_swordSwoosh1, snd_swordSwoosh2, snd_swordSwoosh3],
    hitFlesh: [snd_fleshHitBat1, snd_fleshHitBat2],
    pickup: [snd_baseballBatPickup1, snd_baseballBatPickup2],
  },
};

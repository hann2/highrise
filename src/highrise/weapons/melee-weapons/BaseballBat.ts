import snd_fleshHit3 from "../../../../resources/audio/impacts/flesh-hit-3.flac";
import snd_fleshHit4 from "../../../../resources/audio/impacts/flesh-hit-4.flac";
import snd_swordShing2 from "../../../../resources/audio/weapons/sword-shing-2.flac";
import snd_swordSwoosh1 from "../../../../resources/audio/weapons/sword-swoosh-1.flac";
import snd_swordSwoosh2 from "../../../../resources/audio/weapons/sword-swoosh-2.flac";
import snd_swordSwoosh3 from "../../../../resources/audio/weapons/sword-swoosh-3.flac";
import img_baseballBatHold from "../../../../resources/images/weapons/baseball-bat-hold.png";
import img_baseballBatPickup from "../../../../resources/images/weapons/baseball-bat-pickup.png";
import { degToRad } from "../../../core/util/MathUtil";
import { defaultMeleeWeapon, MeleeWeaponStats } from "../MeleeWeaponStats";

export const BaseballBat: MeleeWeaponStats = {
  ...defaultMeleeWeapon,

  name: "Baseball Bat",

  damage: 50,
  knockbackAmount: 80,
  windUpKnockbackAmount: 20,

  size: [0.2, 1],
  handlePosition: [0.5, 0.9],

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
    hitFlesh: [snd_fleshHit3, snd_fleshHit4],
    pickup: [snd_swordShing2],
  },
};

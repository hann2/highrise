import fleshHit3 from "../../../../resources/audio/impacts/flesh-hit-3.flac";
import fleshHit4 from "../../../../resources/audio/impacts/flesh-hit-4.flac";
import swordShing2 from "../../../../resources/audio/weapons/sword-shing-2.flac";
import swordSwoosh1 from "../../../../resources/audio/weapons/sword-swoosh-1.flac";
import swordSwoosh2 from "../../../../resources/audio/weapons/sword-swoosh-2.flac";
import swordSwoosh3 from "../../../../resources/audio/weapons/sword-swoosh-3.flac";
import baseballBatHold from "../../../../resources/images/weapons/baseball-bat-hold.png";
import baseballBatPickup from "../../../../resources/images/weapons/baseball-bat-pickup.png";
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
    pickup: baseballBatPickup,
    attack: baseballBatPickup,
    hold: baseballBatHold,
  },

  sounds: {
    ...defaultMeleeWeapon.sounds,
    swing: [swordSwoosh1, swordSwoosh2, swordSwoosh3],
    hitFlesh: [fleshHit3, fleshHit4],
    pickup: [swordShing2],
  },
};

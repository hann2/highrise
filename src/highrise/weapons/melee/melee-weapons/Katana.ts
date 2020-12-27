import snd_fleshHit1 from "../../../../../resources/audio/impacts/flesh-hit-1.flac";
import snd_fleshHit2 from "../../../../../resources/audio/impacts/flesh-hit-2.flac";
import snd_fleshHit3 from "../../../../../resources/audio/impacts/flesh-hit-3.flac";
import snd_fleshHit4 from "../../../../../resources/audio/impacts/flesh-hit-4.flac";
import snd_swordShing2 from "../../../../../resources/audio/weapons/sword-shing-2.flac";
import snd_swordSwoosh1 from "../../../../../resources/audio/weapons/sword-swoosh-1.flac";
import snd_swordSwoosh2 from "../../../../../resources/audio/weapons/sword-swoosh-2.flac";
import snd_swordSwoosh3 from "../../../../../resources/audio/weapons/sword-swoosh-3.flac";
import img_katana from "../../../../../resources/images/weapons/katana.png";
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
    pickup: img_katana,
    attack: img_katana,
    hold: img_katana,
  },

  sounds: {
    ...defaultMeleeWeapon.sounds,
    swing: [snd_swordSwoosh1, snd_swordSwoosh2, snd_swordSwoosh3],
    hitFlesh: [snd_fleshHit1, snd_fleshHit2, snd_fleshHit3, snd_fleshHit4],
    pickup: [snd_swordShing2],
  },
};

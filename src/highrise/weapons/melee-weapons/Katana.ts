import swordShing2 from "../../../../resources/audio/weapons/sword-shing-2.flac";
import swordSwoosh1 from "../../../../resources/audio/weapons/sword-swoosh-1.flac";
import swordSwoosh2 from "../../../../resources/audio/weapons/sword-swoosh-2.flac";
import swordSwoosh3 from "../../../../resources/audio/weapons/sword-swoosh-3.flac";
import katana from "../../../../resources/images/weapons/katana.png";
import { degToRad } from "../../../core/util/MathUtil";
import { defaultMeleeWeapon, MeleeWeaponStats } from "../MeleeWeaponStats";

export const Katana: MeleeWeaponStats = {
  ...defaultMeleeWeapon,

  name: "Katana",

  damage: 50,
  knockbackAmount: 20,
  windDownDamage: 30,

  size: [0.2, 1],
  handlePosition: [0.5, 0.9],

  swing: {
    durations: [0.08, 0.17, 0.2],
    angles: [degToRad(110), degToRad(140), degToRad(-75)],
    maxExtension: 0.6,
    restPosition: [0.1, 0.2],
    swingCenter: [0.0, 0.0],
  },

  textures: {
    pickup: katana,
    attack: katana,
    hold: katana,
  },

  sounds: {
    ...defaultMeleeWeapon.sounds,
    swing: [swordSwoosh1, swordSwoosh2, swordSwoosh3],
    pickup: [swordShing2],
  },
};

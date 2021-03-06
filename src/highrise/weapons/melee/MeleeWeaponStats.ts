import snd_fleshHit1 from "../../../../resources/audio/impacts/flesh-hit-1.flac";
import snd_fleshHit2 from "../../../../resources/audio/impacts/flesh-hit-2.flac";
import snd_fleshHit3 from "../../../../resources/audio/impacts/flesh-hit-3.flac";
import snd_pop1 from "../../../../resources/audio/misc/pop1.flac";
import snd_swordShing1 from "../../../../resources/audio/weapons/sword-shing-1.flac";
import img_axe from "../../../../resources/images/weapons/axe.png";
import { SoundName } from "../../../core/resources/sounds";
import { SwingAngles, SwingDurations } from "./SwingDescriptor";
import { BaseWeaponStats } from "../WeaponStats";

// Stats that make a melee weapon unique

export interface MeleeWeaponStats extends BaseWeaponStats {
  // HP of damage done on hit during swing
  damage: number;
  // HP of damage done on hit during windup
  windUpDamage: number;
  // HP of damage done on hit during winddown
  windDownDamage: number;

  // Amount of knockback applied when hit during swing
  knockbackAmount: number;
  // Amount of knockback applied when hit during windUp
  windUpKnockbackAmount: number;
  // Amount of knockback applied when hit during windDown
  windDownKnockbackAmount: number;

  // Anchor point of the texture when holding/swinging
  pivotPosition: [number, number];

  // Offset from the pivot point
  leftHandOffset: [number, number];
  // Offset from the pivot point
  rightHandOffset: [number, number];

  swing: {
    durations?: SwingDurations;
    angles?: SwingAngles;
    maxExtension?: number;
    restPosition?: [number, number];
    swingCenter?: [number, number];
  };

  textures: {
    // Texture rendered by the pickup
    pickup: string;
    // Texture rendered when holding
    hold: string;
    // Texture rendered when attacking
    attack: string;
  };

  sounds: {
    // Sounds to play while swinging
    swing: SoundName[];
    // Sounds to play while winding up
    windup: SoundName[];
    // Sounds to play while winding down
    winddown: SoundName[];
    // Sounds to play when hitting flesh
    hitFlesh: SoundName[];
    // Sound to play when picked up
    pickup: SoundName[];
  };
}

export const defaultMeleeWeapon: MeleeWeaponStats = {
  name: "Melee Weapon",

  damage: 40,
  windUpDamage: 0,
  windDownDamage: 0,

  knockbackAmount: 50,
  windUpKnockbackAmount: 0,
  windDownKnockbackAmount: 0,

  swing: {},

  size: [0.2, 1],
  pivotPosition: [0.5, 0.9],
  leftHandOffset: [0, 0],
  rightHandOffset: [0, 0],

  textures: {
    pickup: img_axe,
    hold: img_axe,
    attack: img_axe,
  },

  sounds: {
    swing: [snd_pop1],
    windup: [],
    winddown: [],
    hitFlesh: [snd_fleshHit1, snd_fleshHit2, snd_fleshHit3],
    pickup: [snd_swordShing1],
  },
};

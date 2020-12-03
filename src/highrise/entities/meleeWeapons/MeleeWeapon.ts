import axe from "../../../../resources/images/axe.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Human from "../Human";
import {
  SwingAngles,
  SwingDescriptor,
  SwingDurations,
} from "./SwingDescriptor";
import SwingingWeapon from "./SwingingWeapon";

// Stats that make a melee weapon unique
export interface MeleeStats {
  // Friendly name of this weapon
  name: string;

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

  // Physical size of the weapon
  size: [number, number];
  // Anchor point of the texture when holding/swinging
  handlePosition: [number, number];

  swing: {
    durations?: SwingDurations;
    angles?: SwingAngles;
    maxExtension?: number;
    restPosition?: [number, number];
    swingCenter?: [number, number];
  };

  // Texture rendered by the pickup
  pickupTexture: string;
  // Texture rendered when holding
  holdTexture: string;
  // Texture rendered when attacking
  attackTexture: string;

  sounds: {
    attack: SoundName[];
    pickup: SoundName[];
  };
}

const defaultMeleeStats: MeleeStats = {
  name: "Melee Weapon",

  damage: 40,
  windUpDamage: 0,
  windDownDamage: 0,

  knockbackAmount: 50,
  windUpKnockbackAmount: 0,
  windDownKnockbackAmount: 0,

  swing: {},

  size: [0.2, 1],
  handlePosition: [0.5, 0.9],

  pickupTexture: axe,
  holdTexture: axe,
  attackTexture: axe,

  sounds: {
    attack: ["pop1"],
    pickup: ["swordShing1"],
  },
};

export default class MeleeWeapon extends BaseEntity implements Entity {
  stats: MeleeStats;
  currentCooldown: number = 0;
  swing: SwingDescriptor;

  constructor(stats: Partial<MeleeStats>) {
    super();
    this.stats = { ...defaultMeleeStats, ...stats };

    const swing = this.stats.swing;
    this.swing = new SwingDescriptor(
      swing.durations,
      swing.angles,
      swing.maxExtension,
      swing.restPosition,
      swing.swingCenter
    );
  }

  attack(holder: Human) {
    if (this.currentCooldown <= 0) {
      this.currentCooldown += this.swing.duration;
      this.addChild(new SwingingWeapon(this, holder));
      this.playSound("attack", holder.getPosition());
    }
  }

  onTick(dt: number) {
    if (this.currentCooldown > 0) {
      (this.currentCooldown -= dt), 0;
    }
  }

  playSound(soundClass: keyof MeleeStats["sounds"], position: V2d) {
    const sounds = this.stats.sounds[soundClass];
    if (sounds.length > 0) {
      const soundName = choose(...sounds);
      this.game?.addEntity(new PositionalSound(soundName, position));
    }
  }
}

import axe from "../../../../resources/images/axe.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import Human from "../Human";
import SwingingWeapon from "./SwingingWeapon";
import { V2d } from "../../../core/Vector";
import { choose } from "../../../core/util/Random";
import { PositionalSound } from "../../../core/sound/PositionalSound";

// Stats that make a melee weapon unique
export interface MeleeStats {
  name: string;
  damage: number;
  // Time between attacks in seconds.  Should be >= attackLength
  attackCooldown: number;
  // Width of swing arc in radians
  swingArc: number;
  // Length of attack in seconds
  attackDuration: number;
  // How far from user will enemies take damage
  attackRange: number;
  // Physical length of weapon
  weaponLength: number;
  // Physical width of weapon's hitbox
  weaponWidth: number;
  // Anchor point of the texture when holding/swinging
  handlePosition: [number, number];
  // Position the player holds the weapon while at rest
  restPosition: [number, number];
  // Center of rotation of the swing
  swingPosition: [number, number];
  // Angle in radians to hold the weapon while not swinging
  restAngle: number;

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
  name: "Melee",
  damage: 40,
  attackCooldown: 2,
  swingArc: Math.PI / 2,
  attackDuration: 2,
  attackRange: 1,
  weaponLength: 1,
  weaponWidth: 0.2,
  handlePosition: [0.5, 0.9],
  swingPosition: [0.0, 0.0],
  restPosition: [0.0, 0.0],
  restAngle: 0,

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

  constructor(stats: Partial<MeleeStats>) {
    super();
    this.stats = { ...defaultMeleeStats, ...stats };
  }

  attack(holder: Human) {
    if (this.currentCooldown <= 0) {
      this.currentCooldown += this.stats.attackCooldown;
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

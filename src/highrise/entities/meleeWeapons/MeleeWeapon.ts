import axe from "../../../../resources/images/axe.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import Human from "../Human";
import SwingingWeapon from "./SwingingWeapon";

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

  attackSound: SoundName;
  texture: string;
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
  attackSound: "fleshHit1",
  texture: axe,
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
    }
  }

  onTick(dt: number) {
    if (this.currentCooldown > 0) {
      (this.currentCooldown -= dt), 0;
    }
  }
}

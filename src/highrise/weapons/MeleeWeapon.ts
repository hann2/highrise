import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Human from "../entities/human/Human";
import { MeleeWeaponStats } from "./MeleeWeaponStats";
import { SwingDescriptor } from "./SwingDescriptor";
import SwingingWeapon from "./SwingingWeapon";

export default class MeleeWeapon extends BaseEntity implements Entity {
  stats: MeleeWeaponStats;
  currentCooldown: number = 0;
  swing: SwingDescriptor;

  constructor(stats: MeleeWeaponStats) {
    super();
    this.stats = stats;

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
    }
  }

  onTick(dt: number) {
    if (this.currentCooldown > 0) {
      (this.currentCooldown -= dt), 0;
    }
  }

  playSound(soundClass: keyof MeleeWeaponStats["sounds"], position: V2d) {
    const sounds = this.stats.sounds[soundClass];
    if (sounds.length > 0) {
      const soundName = choose(...sounds);
      this.game?.addEntity(new PositionalSound(soundName, position));
    }
  }
}

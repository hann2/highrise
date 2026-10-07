import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Human from "../../human/Human";
import { MeleeWeaponStats } from "./MeleeWeaponStats";
import { SwingDescriptor } from "./SwingDescriptor";
import SwingingWeapon from "./SwingingWeapon";

export default class MeleeWeapon extends BaseEntity implements Entity {
  stats: MeleeWeaponStats;
  currentCooldown: number = 0;
  swing: SwingDescriptor;

  private _currentSwing?: SwingingWeapon;

  constructor(stats: MeleeWeaponStats) {
    super();
    this.stats = stats;

    const swing = this.stats.swing;
    this.swing = new SwingDescriptor(
      swing.durations,
      swing.angles,
      swing.maxExtension,
      swing.restPosition,
      swing.swingCenter,
    );
  }

  get currentSwing(): SwingingWeapon | undefined {
    if (this._currentSwing && !this._currentSwing.isDestroyed) {
      return this._currentSwing;
    } else {
      return undefined;
    }
  }

  /** Whether whoever has it swings it left-handed: its swing mirrored across the line straight ahead of them */
  get leftHanded(): boolean {
    return this.parent instanceof Human && this.parent.leftHanded;
  }

  /** Where the hands are on the handle, in the holder's frame */
  getCurrentHandPositions(): [V2d, V2d] {
    const p = this.currentSwing
      ? this.swing.getHandlePosition(this.currentSwing.attackProgress)
      : V(this.swing.restPosition);
    if (this.leftHanded) {
      p.y = -p.y;
    }
    return [p, p.clone()];
  }

  attack(holder: Human) {
    if (this.currentCooldown <= 0) {
      this.currentCooldown += this.swing.duration;
      this._currentSwing = this.addChild(new SwingingWeapon(this, holder));
    }
  }

  @on("tick")
  onTick(dt: number) {
    if (this.currentCooldown > 0) {
      this.currentCooldown -= dt;
    }
  }

  playSound(soundClass: keyof MeleeWeaponStats["sounds"], position: V2d) {
    const sounds = this.stats.sounds[soundClass];
    if (sounds.length > 0) {
      const soundName = choose(...sounds);
      this.game.addEntity(new PositionalSound(soundName, position));
    }
  }
}

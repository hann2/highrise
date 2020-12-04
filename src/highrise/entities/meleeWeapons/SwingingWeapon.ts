import { Body, Box } from "p2";
import { Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import {
  clamp,
  lerp,
  polarToVec,
  radToDeg,
  smootherStep,
} from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../Collision";
import { Layers } from "../../layers";
import { isHittable } from "../Hittable";
import Human from "../Human";
import MeleeWeapon from "./MeleeWeapon";
import { SwingPhase } from "./SwingDescriptor";

// A utility class for dealing with the timings of a swing

export default class SwingingWeapon extends BaseEntity {
  // Number of seconds into the attack
  attackProgress = 0;
  // The weapon that created this attack
  weapon: MeleeWeapon;
  // The human holding the weapon
  holder: Human;

  sprite: Sprite & GameSprite;
  body: Body;

  constructor(weapon: MeleeWeapon, holder: Human) {
    super();

    this.weapon = weapon;
    this.holder = holder;

    const { size, handlePosition, attackTexture } = this.weapon.stats;

    this.sprite = Sprite.from(attackTexture);
    this.sprite.scale.set(size[1] / this.sprite.height);
    this.sprite.anchor.set(...handlePosition);
    this.sprite.layerName = Layers.WEAPONS;

    this.body = new Body({ collisionResponse: false });
    const shape = new Box({
      width: size[0],
      height: size[1],
    });
    shape.collisionGroup = CollisionGroups.Bullets;
    shape.collisionMask = CollisionGroups.Zombies;
    this.body.addShape(shape);
  }

  onRender() {
    const [position, angle] = this.getWeaponPositionAndAngle();
    this.sprite.position.set(...position);
    this.sprite.angle = radToDeg(angle);
  }

  getKnockback() {
    switch (this.getSwingPhase()) {
      case SwingPhase.WindUp:
        return this.weapon.stats.windUpKnockbackAmount;
      case SwingPhase.Swing:
        return this.weapon.stats.knockbackAmount;
      case SwingPhase.WindDown:
        return this.weapon.stats.windDownKnockbackAmount;
    }
  }

  getDamage() {
    switch (this.getSwingPhase()) {
      case SwingPhase.WindUp:
        return this.weapon.stats.windUpDamage;
      case SwingPhase.Swing:
        return this.weapon.stats.damage;
      case SwingPhase.WindDown:
        return this.weapon.stats.windDownDamage;
    }
  }

  onTick(dt: number) {
    const [[x, y], angle] = this.getWeaponPositionAndAngle();
    this.body.position[0] = x;
    this.body.position[1] = y;
    this.body.angle = angle;

    if (this.attackProgress >= this.weapon.swing.duration) {
      this.destroy();
    } else {
      this.attackProgress += dt;
    }
  }

  getSwingPhase(): SwingPhase {
    return this.weapon.swing.getPhase(this.attackProgress);
  }

  getWeaponPositionAndAngle(): [V2d, number] {
    // The location of the handle relative to the body of the human
    const localPosition = this.weapon.swing.getHandlePosition(
      this.attackProgress
    );

    const localAngle = this.weapon.swing.getAngle(this.attackProgress);

    // The location of the handle relative to the world
    const worldPosition = this.holder.localToWorld(localPosition);

    // The angle to draw the weapon sprite at
    const worldAngle = Math.PI / 2 + localAngle + this.holder.getDirection(); // Duno why
    return [worldPosition, worldAngle];
  }

  onBeginContact(other: Entity, _: unknown, __: unknown) {
    if (other != this.holder && isHittable(other)) {
      other.onMeleeHit(this, this.getPosition());
    }
  }
}

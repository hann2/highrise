import { Body, Box } from "p2";
import { Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { isHittable } from "../../environment/Hittable";
import Human from "../../human/Human";
import { Layer } from "../../config/layers";
import { CollisionGroups } from "../../config/CollisionGroups";
import MeleeWeapon from "./MeleeWeapon";
import { SwingPhase } from "./SwingDescriptor";
import { lerp } from "../../../core/util/MathUtil";
import { off } from "process";

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

    const { size, pivotPosition: handlePosition, textures } = this.weapon.stats;

    this.sprite = Sprite.from(textures.attack);
    this.sprite.scale.set(size[1] / this.sprite.height);
    this.sprite.anchor.set(...handlePosition);
    this.sprite.layerName = Layer.WEAPONS;

    this.body = new Body({ collisionResponse: false });
    this.body.type = Body.DYNAMIC; // Cuz it moves
    const shape = new Box({
      width: size[0],
      height: size[1] * 1.1,
    });
    shape.collisionGroup = CollisionGroups.Projectiles;
    shape.collisionMask = CollisionGroups.Enemies | CollisionGroups.Walls;
    // figured through trial and error
    const offset: [number, number] = [
      lerp(-size[1] / 2, size[1] / 2, handlePosition[1]),
      lerp(-size[0] / 2, size[0] / 2, handlePosition[0]),
    ];
    this.body.addShape(shape, offset);
  }

  async onAdd() {
    this.weapon.playSound("windup", this.holder.getPosition());
    await this.wait(this.weapon.swing.windDownDuration, undefined, "windup");
    this.weapon.playSound("swing", this.holder.getPosition());
    await this.wait(this.weapon.swing.swingDuration, undefined, "swing");
    this.weapon.playSound("winddown", this.holder.getPosition());
  }

  onRender() {
    const [position, angle] = this.getWeaponPositionAndAngle();
    this.sprite.position.set(...position);
    this.sprite.rotation = angle + Math.PI / 2; // Why?
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
    // The location of the handle relative to the holder
    const localPosition = this.weapon.swing.getHandlePosition(
      this.attackProgress
    );

    // The angle of the weapon relative to the holder
    const localAngle = this.weapon.swing.getAngle(this.attackProgress);

    // The location of the handle relative to the world
    const worldPosition = this.holder.localToWorld(localPosition);

    // The angle to draw the weapon sprite at
    const worldAngle = localAngle + this.holder.getDirection();
    return [worldPosition, worldAngle];
  }

  onBeginContact(other: Entity, _: unknown, __: unknown) {
    if (other != this.holder && isHittable(other)) {
      other.onMeleeHit(this, this.getPosition());
    }
  }
}

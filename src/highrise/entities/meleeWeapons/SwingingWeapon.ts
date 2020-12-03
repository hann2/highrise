import { Body, Box } from "p2";
import { Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import {
  clamp,
  lerp,
  polarToVec,
  radToDeg,
  smootherStep,
} from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../Collision";
import { isHittable } from "../Hittable";
import Human from "../Human";
import MeleeWeapon from "./MeleeWeapon";

export default class SwingingWeapon extends BaseEntity {
  attackProgress = 0;
  weapon: MeleeWeapon;
  holder: Human;
  sprite: Sprite;
  body: Body;

  constructor(weapon: MeleeWeapon, holder: Human) {
    super();

    this.weapon = weapon;
    this.holder = holder;

    this.sprite = Sprite.from(weapon.stats.attackTexture);
    this.sprite.scale.set(weapon.stats.weaponLength / this.sprite.height);
    this.sprite.anchor.set(...weapon.stats.handlePosition);

    const width = this.weapon.stats.weaponWidth;
    const length = this.weapon.stats.weaponLength;
    this.body = new Body();
    const shape = new Box({
      width,
      height: length,
    });
    this.body.addShape(shape);
    this.body.collisionResponse = false;
    shape.collisionGroup = CollisionGroups.Bullets;
    shape.collisionMask = CollisionGroups.Zombies;
  }

  onRender() {
    const [position, angle] = this.getWeaponPositionAndAngle();
    this.sprite.position.set(...position);
    this.sprite.angle = radToDeg(angle);
  }

  onTick(dt: number) {
    const [[x, y], angle] = this.getWeaponPositionAndAngle();
    this.body.position[0] = x;
    this.body.position[1] = y;
    this.body.angle = angle;

    if (this.attackProgress >= this.weapon.stats.attackDuration) {
      this.destroy();
    } else {
      this.attackProgress += dt;
    }
  }

  get attackPercent() {
    return this.attackProgress / this.weapon.stats.attackDuration;
  }

  get swingPhase(): SwingPhase {
    if (this.attackPercent < this.weapon.stats.windupTime) {
      return SwingPhase.WindUp;
    } else if (this.attackPercent < 1.0 - this.weapon.stats.winddownTime) {
      return SwingPhase.Swing;
    } else {
      return SwingPhase.WindDown;
    }
  }

  getWeaponPositionAndAngle(): [V2d, number] {
    const {
      attackRange,
      handlePosition,
      restAngle,
      restPosition,
      swingArcEnd,
      swingArcStart,
      swingPosition,
      weaponLength,
      winddownTime,
      windupTime,
    } = this.weapon.stats;

    // 0 is start of attack, 1 is end

    // local angles of the swing arc in radians CCW
    const armsAngle = weaponSwingAngle(
      restAngle,
      swingArcStart,
      swingArcEnd,
      windupTime,
      winddownTime,
      this.attackPercent
    );

    // Distance between the human center and the handle at full extension
    const maxExtension = attackRange - weaponLength * handlePosition[1];
    // Current distance between the human center and the handle
    const armExtension =
      extensionTween(windupTime, winddownTime, this.attackPercent) *
      maxExtension;

    // Location the rotation is happening around
    const basePosition = V(restPosition).lerp(
      swingPosition,
      basePositionTween(this.attackPercent)
    );

    // The location of the handle relative to the body of the human
    const localPosition = basePosition.add(polarToVec(armsAngle, armExtension));

    // The location of the handle relative to the world
    const worldPosition = this.holder.localToWorld(localPosition);

    // The angle to draw the weapon sprite at
    const imageAngle = Math.PI / 2 + armsAngle + this.holder.getDirection(); // Duno why
    return [worldPosition, imageAngle];
  }

  onBeginContact(other: Entity, _: unknown, __: unknown) {
    if (other != this.holder && isHittable(other)) {
      other.onMeleeHit(this, this.getPosition());
    }
  }
}

export enum SwingPhase {
  WindUp,
  Swing,
  WindDown,
}

function weaponSwingAngle(
  restAngle: number,
  backAngle: number,
  forwardAngle: number,
  windupTime: number,
  winddownTime: number,
  attackPercent: number
): number {
  if (attackPercent < windupTime) {
    const t = attackPercent / windupTime;
    return lerp(restAngle, backAngle, smootherStep(t));
  } else if (attackPercent < 1.0 - winddownTime) {
    const t =
      (attackPercent - windupTime) / (1.0 - (windupTime + winddownTime));
    return lerp(backAngle, forwardAngle, smootherStep(t));
  } else {
    const t = (attackPercent - (1.0 - winddownTime)) / winddownTime;
    return lerp(forwardAngle, restAngle, smootherStep(t));
  }
}

function extensionTween(
  windupTime: number,
  winddownTime: number,
  t: number
): number {
  if (t < windupTime) {
    return lerp(0, 0.5, (t / windupTime) ** 2);
  } else if (t < 1.0 - winddownTime) {
    const t2 = (t - windupTime) / (1.0 - windupTime - winddownTime);
    return 0.5 + 0.5 * Math.abs(Math.sin(clamp(t2) * Math.PI)) ** 0.5;
  } else {
    return lerp(0.5, 0, (t - (1.0 - winddownTime)) / winddownTime);
  }
}

function basePositionTween(percent: number): number {
  return Math.abs(Math.sin(clamp(percent) * Math.PI)) ** 0.5;
}

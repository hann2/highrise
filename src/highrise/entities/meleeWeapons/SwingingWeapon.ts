import { Body, Box } from "p2";
import { Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import {
  lerp,
  polarToVec,
  radToDeg,
  smoothStep,
  clamp,
} from "../../../core/util/MathUtil";
import { V2d, V } from "../../../core/Vector";
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

  getWeaponPositionAndAngle(): [V2d, number] {
    const {
      weaponLength,
      attackRange,
      swingArc,
      attackDuration,
      handlePosition,
      restPosition,
      swingPosition,
      restAngle,
    } = this.weapon.stats;

    // 0 is start of attack, 1 is end
    const attackPercent = this.attackProgress / attackDuration;

    // local angles of the swing arc in radians CCW
    const arcBegin = swingArc / 2;
    const arcEnd = -swingArc / 2;
    const swingPercent = weaponSwingTween(attackPercent);
    const armsAngle = lerp(arcBegin, arcEnd, swingPercent);

    // Distance between the human center and the handle at full extension
    const maxExtension = attackRange - weaponLength * handlePosition[1];
    // Current distance between the human center and the handle
    const armExtension = extensionTween(attackPercent) * maxExtension;

    // Location the rotation is happening around
    const basePosition = V(restPosition).lerp(
      swingPosition,
      basePositionTween(attackPercent)
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
      other.onMeleeHit(this.weapon, this.getPosition());
    }
  }
}

function weaponSwingTween(percent: number): number {
  if (percent < 0.2) {
    return lerp(0.4, 0, smoothStep(percent / 0.2));
  } else if (percent < 0.8) {
    return smoothStep((percent - 0.2) / 0.6);
  } else {
    return lerp(1, 0.4, smoothStep((percent - 0.8) / 0.2));
  }
}

function extensionTween(percent: number): number {
  return Math.abs(Math.sin(clamp(percent) * Math.PI)) ** 0.5;
}

function basePositionTween(percent: number): number {
  return Math.abs(Math.sin(clamp(percent) * Math.PI)) ** 0.5;
}

import { Body, Box } from "p2";
import { Sprite } from "pixi.js";
import axe from "../../../../resources/images/axe.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { polarToVec, radToDeg } from "../../../core/util/MathUtil";
import { V2d } from "../../../core/Vector";
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

    this.sprite = Sprite.from(axe);
    this.sprite.scale.set(weapon.stats.weaponLength / this.sprite.height);
    this.sprite.anchor.set(0.5, 0.5);

    const width = this.weapon.stats.weaponWidth;
    const length = this.weapon.stats.weaponLength;
    this.body = new Body();
    this.body.addShape(
      new Box({
        width,
        height: length,
      })
    );
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
    const length = this.weapon.stats.weaponLength;
    const range = this.weapon.stats.attackRange;
    const arc = this.weapon.stats.swingArc;
    const duration = this.weapon.stats.attackDuration;

    const startingAngle = this.holder.getDirection() + arc / 2;
    const angle1 = startingAngle - (arc * this.attackProgress) / duration;
    const angle2 =
      startingAngle + Math.PI / 2 - (arc * this.attackProgress) / duration;
    const position = this.holder
      .getPosition()
      .add(polarToVec(angle1, range - length / 2));

    return [position, angle2];
  }

  onBeginContact(other: Entity, _: unknown, __: unknown) {
    if (other != this.holder && isHittable(other)) {
      other.onMeleeHit(this.weapon, this.getPosition());
    }
  }
}

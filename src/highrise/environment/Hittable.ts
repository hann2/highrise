import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import Bullet from "../projectiles/Bullet";
import SwingingWeapon from "../weapons/melee/SwingingWeapon";

export default interface Hittable extends Entity {
  onBulletHit(bullet: Bullet, position: V2d, normal: V2d): boolean;
  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void;
}

export const isHittable = (x: any): x is Hittable =>
  typeof x?.onBulletHit === "function" && typeof x?.onMeleeHit === "function";

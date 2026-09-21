import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import Bullet from "../projectiles/Bullet";
import SwingingWeapon from "../weapons/melee/SwingingWeapon";

export default interface Hittable extends Entity {
  hitByBullet(bullet: Bullet, position: V2d, normal: V2d): boolean;
  hitByMelee(swingingWeapon: SwingingWeapon, position: V2d): void;
}

export const isHittable = (x: any): x is Hittable =>
  typeof x?.hitByBullet === "function" && typeof x?.hitByMelee === "function";

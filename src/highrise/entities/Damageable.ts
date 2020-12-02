import Entity from "../../core/entity/Entity";
import Bullet from "./Bullet";
import { V2d } from "../../core/Vector";

export default interface Hittable extends Entity {
  onBulletHit(bullet: Bullet, position: V2d): void;
}

export const isHittable = (x: any): x is Hittable =>
  typeof x?.onBulletHit === "function";

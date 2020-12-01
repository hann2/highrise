import Entity from "../../core/entity/Entity";

export default interface Damageable extends Entity {
  damage(damage: number): void;
}

export const isDamageable = (x: any): x is Damageable => !!x?.damage;

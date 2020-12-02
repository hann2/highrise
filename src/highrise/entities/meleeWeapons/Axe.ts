import axe from "../../../../resources/images/axe.png";
import MeleeWeapon from "./MeleeWeapon";

export default class Axe extends MeleeWeapon {
  constructor() {
    super({
      name: "Axe",
      damage: 40,
      attackCooldown: 0.4,
      swingArc: Math.PI / 2,
      attackDuration: 0.2,
      attackRange: 1,
      weaponLength: 1,
      weaponWidth: 0.2,
      attackSound: "fleshHit1",
      texture: axe,
    });
  }
}

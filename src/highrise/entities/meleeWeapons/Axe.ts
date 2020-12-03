import axe from "../../../../resources/images/axe.png";
import MeleeWeapon from "./MeleeWeapon";
import { degToRad } from "../../../core/util/MathUtil";

export default class Axe extends MeleeWeapon {
  constructor() {
    super({
      name: "Axe",
      damage: 50,
      attackCooldown: 0.3,
      attackDuration: 0.3,

      swingArc: degToRad(145),
      attackRange: 1.3,

      weaponLength: 1,
      weaponWidth: 0.2,
      handlePosition: [0.5, 0.9],
      restPosition: [0.2, 0.3],
      swingPosition: [0.0, 0.1],
      restAngle: degToRad(80),

      pickupTexture: axe,
      attackTexture: axe,
      holdTexture: axe,

      sounds: {
        attack: ["swordShing1", "swordShing2", "swordShing3", "swordShing4"],
        pickup: ["swordShing3"],
      },
    });
  }
}

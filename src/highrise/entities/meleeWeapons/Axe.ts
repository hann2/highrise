import axe from "../../../../resources/images/axe.png";
import MeleeWeapon from "./MeleeWeapon";
import { degToRad } from "../../../core/util/MathUtil";

export default class Axe extends MeleeWeapon {
  constructor() {
    super({
      name: "Axe",
      damage: 100,
      attackCooldown: 0.65,
      attackDuration: 0.65,

      windupTime: 0.4,
      winddownTime: 0.2,
      swingArcStart: degToRad(90),
      swingArcEnd: degToRad(-90),
      attackRange: 1.3,

      weaponLength: 1,
      weaponWidth: 0.2,
      handlePosition: [0.5, 0.85],
      restPosition: [0.15, 0.4],
      swingPosition: [0.0, 0.1],
      restAngle: degToRad(-75),

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

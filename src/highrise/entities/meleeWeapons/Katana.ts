import katana from "../../../../resources/images/weapons/katana.png";
import MeleeWeapon from "./MeleeWeapon";
import { degToRad } from "../../../core/util/MathUtil";

export default class Katana extends MeleeWeapon {
  constructor() {
    super({
      name: "Katana",
      damage: 50,
      attackCooldown: 0.22,
      attackDuration: 0.22,

      swingArc: degToRad(165),
      weaponLength: 1,
      attackRange: 1.5,
      weaponWidth: 0.2,
      handlePosition: [0.5, 0.9],
      restPosition: [0.0, 0.25],
      swingPosition: [0.0, 0.0],
      restAngle: degToRad(-15),

      pickupTexture: katana,
      attackTexture: katana,
      holdTexture: katana,

      sounds: {
        attack: ["swordShing3", "swordShing4"],
        pickup: ["swordShing2"],
      },
    });
  }
}

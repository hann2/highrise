import axe from "../../../../resources/images/axe.png";
import MeleeWeapon from "./MeleeWeapon";
import { SwingDescriptor } from "./SwingDescriptor";
import { degToRad } from "../../../core/util/MathUtil";

export default class Axe extends MeleeWeapon {
  constructor() {
    super({
      name: "Axe",

      damage: 80,
      windUpDamage: 20,

      knockbackAmount: 80,
      windUpKnockbackAmount: 40,

      size: [0.2, 1],
      handlePosition: [0.5, 0.85],

      swing: {
        durations: [0.4, 0.2, 0.2],
        angles: [degToRad(-75), degToRad(90), degToRad(-90)],
        maxExtension: 0.3,
        restPosition: [0.15, 0.4],
        swingCenter: [0.0, 0.1],
      },

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

import katana from "../../../../resources/images/weapons/katana.png";
import { degToRad } from "../../../core/util/MathUtil";
import { V } from "../../../core/Vector";
import MeleeWeapon from "./MeleeWeapon";
import { SwingDescriptor } from "./SwingDescriptor";

export default class Katana extends MeleeWeapon {
  constructor() {
    super({
      name: "Katana",

      damage: 50,
      knockbackAmount: 20,
      windDownDamage: 30,

      size: [0.2, 1],
      handlePosition: [0.5, 0.9],

      swing: {
        durations: [0.2, 0.2, 0.2],
        angles: [degToRad(110), degToRad(140), degToRad(-75)],
        maxExtension: 0.6,
        restPosition: [0.1, 0.2],
        swingCenter: [0.0, 0.0],
      },

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

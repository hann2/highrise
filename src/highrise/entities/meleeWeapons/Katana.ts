import katana from "../../../../resources/images/weapons/katana.png";
import MeleeWeapon from "./MeleeWeapon";

export default class Katana extends MeleeWeapon {
  constructor() {
    super({
      name: "Katana",
      damage: 50,
      attackCooldown: 0.2,
      swingArc: Math.PI / 2,
      attackDuration: 0.2,
      attackRange: 1,
      weaponLength: 1,
      weaponWidth: 0.2,
      pickupTexture: katana,
      attackTexture: katana,
      holdTexture: katana,
      sounds: {
        attack: ["swordShing1", "swordShing2"],
        pickup: ["swordShing3"],
      },
    });
  }
}

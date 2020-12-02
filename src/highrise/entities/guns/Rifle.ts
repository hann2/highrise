import Gun, { FireMode } from "./Gun";

export default class Rifle extends Gun {
  constructor() {
    super({
      name: "Rifle",
      fireRate: 10,
      bulletDamage: 40,
      muzzleVelocity: 120,
      fireMode: FireMode.FULL_AUTO,

      sounds: {
        shoot: ["rifleShot1", "rifleShot2", "rifleShot3"],
        empty: ["dryFire1", "dryFire2"],
        pickup: ["magazineLoad1"],
        reload: ["reload1"],
      },
    });
  }
}

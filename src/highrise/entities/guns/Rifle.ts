import Gun, { FireMode, ReloadingStyle } from "./Gun";

export default class Rifle extends Gun {
  constructor() {
    super({
      name: "Rifle",
      fireRate: 10,
      bulletDamage: 40,
      muzzleVelocity: 120,
      fireMode: FireMode.FULL_AUTO,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      reloadTime: 1.5,
      ammoCapacity: 30,

      sounds: {
        shoot: ["rifleShot1", "rifleShot2", "rifleShot3"],
        empty: ["dryFire3"],
        pickup: ["magazineLoad1"],
        reload: ["reload1"],
      },
    });
  }
}

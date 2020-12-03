import Gun, { ReloadingStyle } from "./Gun";

export default class Pistol extends Gun {
  constructor() {
    super({
      name: "Pistol",
      fireRate: 9,
      bulletDamage: 34,
      muzzleVelocity: 60,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      reloadTime: 0.9,
      ammoCapacity: 7,

      sounds: {
        shoot: ["pistolShot2"],
        empty: ["dryFire2"],
        pickup: ["pistolCock1"],
        reload: ["magazineLoad1"],
      },
    });
  }
}

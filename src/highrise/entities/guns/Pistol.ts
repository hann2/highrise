import Gun, { ReloadingStyle } from "./Gun";

export default class Pistol extends Gun {
  constructor() {
    super({
      name: "Pistol",
      fireRate: 9,
      bulletDamage: 34,
      muzzleVelocity: 60,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      ammoCapacity: 15,

      sounds: {
        shoot: ["pistol2Shot1", "pistol2Shot2"],
        empty: ["dryFire2"],
        pickup: ["pistolCock1"],
        reload: ["reload1"],
      },
    });
  }
}

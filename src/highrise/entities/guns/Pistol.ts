import Gun from "./Gun";

export default class Pistol extends Gun {
  constructor() {
    super({
      name: "Pistol",
      fireRate: 5.0,
      bulletDamage: 40,
      muzzleVelocity: 60,
    });
  }
}

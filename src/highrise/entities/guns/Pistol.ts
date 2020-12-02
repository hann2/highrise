import Gun from "./Gun";

export default class Pistol extends Gun {
  constructor() {
    super({
      name: "Pistol",
      fireRate: 1.6,
      bulletDamage: 20,
      muzzleVelocity: 60,
    });
  }
}

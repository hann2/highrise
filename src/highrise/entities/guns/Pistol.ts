import Gun from "./Gun";

export default class Pistol extends Gun {
  constructor() {
    super({
      name: "Pistol",
      fireRate: 9,
      bulletDamage: 34,
      muzzleVelocity: 60,
    });
  }
}

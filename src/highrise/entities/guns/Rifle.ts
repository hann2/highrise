import Gun, { FireMode } from "./Gun";

export default class Rifle extends Gun {
  constructor() {
    super({
      fireRate: 10,
      bulletDamage: 70,
      muzzleVelocity: 120,
      fireMode: FireMode.FULL_AUTO,
    });
  }
}

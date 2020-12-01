import Gun from "./Gun";

export default class Pistol extends Gun {
  constructor() {
    super({ fireRate: 6.0, bulletDamage: 40 });
  }
}

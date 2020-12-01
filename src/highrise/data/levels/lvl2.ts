import { V } from "../../../core/Vector";
import Party from "../../entities/Party";
import Wall from "../../entities/Wall";
import Zombie from "../../entities/Zombie";
import Level from "./Level";

export default class Level2 extends Level {
  constructor() {
    super();
  }

  beginLevel(party: Party) {
    const spawnLocations = [
      V(5, 20 - 5),
      V(6.5, 20 - 5),
      V(5, 20 - 6.5),
      V(3, 20 - 3),
    ];

    const entities = [
      new Zombie(V(10, 20 - 8)),
      new Zombie(V(10, 20 - 15)),
      new Zombie(V(12, 20 - 17)),
      new Zombie(V(12, 20 - 15)),
      new Zombie(V(13, 20 - 3)),
      new Zombie(V(2, 20 - 12)),
      new Zombie(V(2, 20 - 15)),
      new Zombie(V(6, 20 - 15)),
      new Wall(0, 20 - 0, 20, 20 - 1),
      new Wall(0, 20 - 0, 1, 20 - 20),
      new Wall(0, 20 - 19, 20, 20 - 20),
      new Wall(19, 20 - 0, 20, 20 - 20),
      new Wall(0, 20 - 16, 5, 20 - 17),
      new Wall(7, 20 - 13, 8, 20 - 20),
      new Wall(3, 20 - 13, 8, 20 - 14),
      new Wall(0, 20 - 10, 17, 20 - 11),
      new Wall(7, 20 - 3, 8, 20 - 10),
    ];

    super.start(spawnLocations, entities, party);
  }
}

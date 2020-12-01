import { V } from "../../../core/Vector";
import AIHumanController from "../../entities/AIHumanController";
import Exit from "../../entities/Exit";
import Shotgun from "../../entities/guns/Shotgun";
import Human from "../../entities/Human";
import Party from "../../entities/Party";
import Wall from "../../entities/Wall";
import Zombie from "../../entities/Zombie";
import Level from "./Level";

export default class Level1 extends Level {
  constructor() {
    super(1);
  }

  placeEntities(party: Party) {
    const spawnLocations = [V(5, 5), V(6.5, 5), V(5, 6.5), V(3, 3)];

    const ella = new Human(V(15, 6.5));
    ella.gun = new Shotgun();

    const entities = [
      new Zombie(V(10, 8)),
      new Zombie(V(10, 15)),
      new Zombie(V(12, 17)),
      new Zombie(V(12, 15)),
      new Zombie(V(13, 3)),
      new Zombie(V(2, 12)),
      new Zombie(V(2, 15)),
      new Zombie(V(6, 15)),
      new Wall(0, 0, 20, 1),
      new Wall(0, 0, 1, 20),
      new Wall(0, 19, 20, 20),
      new Wall(19, 0, 20, 20),
      new Wall(0, 16, 5, 17),
      new Wall(7, 13, 8, 20),
      new Wall(3, 13, 8, 14),
      new Wall(0, 10, 17, 11),
      new Wall(7, 3, 8, 10),
      new Exit(1, 17, 4, 19),
      ella,
      ella.gun,
      new AIHumanController(ella),
    ];

    super.placeParty(spawnLocations, entities, party);
  }
}

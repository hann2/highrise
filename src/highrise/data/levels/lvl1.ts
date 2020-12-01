import { V } from "../../../core/Vector";
import Party from "../../entities/Party";
import Wall from "../../entities/Wall";
import Zombie from "../../entities/Zombie";
import Map from "./Map";

const spawnLocations = [V(5, 5), V(6.5, 5), V(5, 6.5), V(3, 3)];

export default class Level1 extends Map {
  constructor(party: Party) {
    super(
      spawnLocations,
      [
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
      ],
      party
    );
  }
}

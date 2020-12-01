import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Human from "./Human";
import PlayerHumanController from "./PlayerHumanController";
import AIHumanController from "./AIHumanController";
import Zombie from "./Zombie";
import Wall from "./Wall";
import { V } from "../../core/Vector";
import Pistol from "./Pistol";
import Shotgun from "./Shotgun";

const walls = [
    [0, 0, 20, 1],
    [0, 0, 1, 20],
    [0, 19, 20, 20],
    [19, 0, 20, 20],
    [0, 16, 5, 17],
    [7, 13, 8, 20],
    [3, 13, 8, 14],
    [0, 10, 17, 11],
    [7, 3, 8, 10]
];

export default class TestMap extends BaseEntity implements Entity {
  constructor() {
    super();
    
    const player = this.addChild(new Human(V(5, 5)));
    player.gun = this.addChild(new Shotgun(player.body));
    this.addChild(new PlayerHumanController(player));
    const george = this.addChild(new Human(V(6.5, 5)));
    george.gun = this.addChild(new Pistol(george.body));
    this.addChild(new AIHumanController(george, player));
    const georgia = this.addChild(new Human(V(5, 6.5)));
    this.addChild(new AIHumanController(georgia, player));

    this.addChild(new Zombie(V(10, 8)));
    this.addChild(new Zombie(V(10, 15)));
    this.addChild(new Zombie(V(12, 17)));
    this.addChild(new Zombie(V(12, 15)));
    this.addChild(new Zombie(V(13, 3)));
    this.addChild(new Zombie(V(2, 12)));
    this.addChild(new Zombie(V(2, 15)));
    this.addChild(new Zombie(V(6, 15)));
    for (const wall of walls) {
        this.addChild(new Wall(wall[0], wall[1], wall[2], wall[3]));
    }
  }
}
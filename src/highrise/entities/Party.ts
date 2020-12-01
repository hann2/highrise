import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import AIHumanController from "./AIHumanController";
import Pistol from "./guns/Pistol";
import Rifle from "./guns/Rifle";
import Shotgun from "./guns/Shotgun";
import Human from "./Human";
import PlayerHumanController from "./PlayerHumanController";

export default class Party extends BaseEntity implements Entity {
  constructor(entities: Entity[]) {
    super();

    this.addChildren(...entities);
  }

  respawn(spawnLocations: V2d[]): void {
    this.children
      .filter((c) => c instanceof Human)
      .forEach((c, idx) => (c as Human).setPosition(spawnLocations[idx]));
  }
}

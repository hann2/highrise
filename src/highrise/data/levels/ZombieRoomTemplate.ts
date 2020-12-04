import Entity from "../../../core/entity/Entity";
import { V } from "../../../core/Vector";
import Zombie from "../../entities/Zombie";
import { AngleTransformer, CellTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

export default class ZombieRoomTemplate extends RoomTemplate {
  constructor() {
    super(V(3, 2), [
      [V(-1, 1), true],
      [V(2, -1), false],
    ]);
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const zombies: Entity[] = [];
    for (let i = 0; i < this.dimensions.x; i++) {
      for (let j = 0; j < this.dimensions.y; j++) {
        zombies.push(new Zombie(transformCell(V(i, j).add(V(0.25, 0.25)))));
        zombies.push(new Zombie(transformCell(V(i, j).add(V(-0.25, 0.25)))));
        zombies.push(new Zombie(transformCell(V(i, j).add(V(0.25, -0.25)))));
        zombies.push(new Zombie(transformCell(V(i, j).add(V(-0.25, -0.25)))));
      }
    }
    return zombies;
  }
}

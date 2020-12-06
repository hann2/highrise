import Entity from "../../../../core/entity/Entity";
import { V } from "../../../../core/Vector";
import Zombie from "../../../entities/zombie/Zombie";
import { PointLight } from "../../../lighting/PointLight";
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
    const entities: Entity[] = [];
    for (let i = 0; i < this.dimensions.x; i++) {
      for (let j = 0; j < this.dimensions.y; j++) {
        entities.push(new Zombie(transformCell(V(i, j).add(V(0.25, 0.25)))));
        entities.push(new Zombie(transformCell(V(i, j).add(V(-0.25, 0.25)))));
        entities.push(new Zombie(transformCell(V(i, j).add(V(0.25, -0.25)))));
        entities.push(new Zombie(transformCell(V(i, j).add(V(-0.25, -0.25)))));
      }
    }
    const light1 = new PointLight(4, 0.8, 0xb0e0e6);
    light1.setPosition(transformCell(V(0.5, 0.5)));
    entities.push(light1);
    const light2 = new PointLight(4, 0.8, 0xb0e0e6);
    light2.setPosition(transformCell(V(1.5, 0.5)));
    entities.push(light2);
    return entities;
  }
}

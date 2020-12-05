import Entity from "../../../../core/entity/Entity";
import { V } from "../../../../core/Vector";
import SpawnLocation from "../../../entities/SpawnLocation";
import { PointLight } from "../../../lighting/PointLight";
import { bathroomTiles } from "../../../view/DecorationSprite";
import { AngleTransformer, CellTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

export default class SpawnRoom extends RoomTemplate {
  constructor() {
    super(V(3, 3), [[V(2, 0), true]], bathroomTiles);
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    const light = new PointLight(6, 0.8);
    light.setPosition(transformCell(V(1, 1)));
    entities.push(light);

    entities.push(new SpawnLocation(transformCell(V(1, 2))));
    entities.push(new SpawnLocation(transformCell(V(0, 1))));
    entities.push(new SpawnLocation(transformCell(V(1, 1))));
    entities.push(new SpawnLocation(transformCell(V(2, 1))));

    return entities;
  }
}

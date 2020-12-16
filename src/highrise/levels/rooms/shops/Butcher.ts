import Entity from "../../../../core/entity/Entity";
import { V } from "../../../../core/Vector";
import Decoration from "../../../environment/Decoration";
import { PointLight } from "../../../lighting-and-vision/PointLight";
import {
  bathroomTilesFloor5,
  butcherStall,
} from "../../../environment/decorations/decorations";
import { AngleTransformer, CellTransformer } from "../ElementTransformer";
import RoomTemplate from "../RoomTemplate";

export default class Butcher extends RoomTemplate {
  constructor() {
    super(
      V(3, 3),
      [
        [V(2, 1), true],
        [V(1, 2), false],
        [V(-1, 2), true],
      ],
      bathroomTilesFloor5
    );
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    entities.push(new Decoration(transformCell(V(0.63, 0.28)), butcherStall));
    entities.push(
      new PointLight({
        radius: 6,
        intensity: 0.6,
        position: transformCell(V(1, 1)),
      })
    );

    return entities;
  }
}

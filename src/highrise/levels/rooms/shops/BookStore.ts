import Entity from "../../../../core/entity/Entity";
import { V } from "../../../../core/Vector";
import Decoration from "../../../environment/Decoration";
import { PointLight } from "../../../lighting-and-vision/PointLight";
import {
  bakeryStall,
  bathroomTilesFloor5,
  oakFloor,
  shelfEmpty,
  shelfJars,
} from "../../../environment/decorations/decorations";
import { AngleTransformer, CellTransformer } from "../ElementTransformer";
import RoomTemplate from "../RoomTemplate";

export default class BookStore extends RoomTemplate {
  constructor() {
    super(
      V(3, 3),
      [
        [V(2, 1), true],
        [V(1, 2), false],
        [V(-1, 2), true],
      ],
      oakFloor
    );
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    entities.push(new Decoration(transformCell(V(0.28, 0.28)), bakeryStall));
    entities.push(new Decoration(transformCell(V(1.4, -0.15)), shelfEmpty));
    entities.push(new Decoration(transformCell(V(2.1, -0.15)), shelfJars));
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

import Entity from "../../../core/entity/Entity";
import { V } from "../../../core/Vector";
import Furniture from "../../entities/Furniture";
import {
  bakeryStall,
  bathroomTiles,
  shelfEmpty,
  shelfJars,
} from "../../view/DecorationSprite";
import { AngleTransformer, CellTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

export default class ShopTemplate extends RoomTemplate {
  constructor() {
    super(
      V(3, 3),
      [
        [V(2, 1), true],
        [V(1, 2), false],
      ],
      bathroomTiles
    );
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    entities.push(new Furniture(transformCell(V(0.28, 0.28)), bakeryStall));
    entities.push(new Furniture(transformCell(V(1.4, -0.15)), shelfEmpty));
    entities.push(new Furniture(transformCell(V(2.1, -0.15)), shelfJars));

    return entities;
  }
}

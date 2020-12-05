import Entity from "../../../../../core/entity/Entity";
import { V } from "../../../../../core/Vector";
import Furniture from "../../../../entities/Furniture";
import { PointLight } from "../../../../lighting/PointLight";
import {
  bakeryStall,
  bathroomTiles,
  shelfEmpty,
  shelfJars,
} from "../../../../view/DecorationSprite";
import { AngleTransformer, CellTransformer } from "../ElementTransformer";
import RoomTemplate from "../RoomTemplate";

export default class ProduceShop2 extends RoomTemplate {
  constructor() {
    super(
      V(3, 3),
      [
        [V(2, 1), true],
        [V(1, 2), false],
        [V(-1, 2), true],
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
    const light = new PointLight(6, 0.6);
    light.setPosition(transformCell(V(1, 1)));
    entities.push(light);

    return entities;
  }
}

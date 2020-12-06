import Entity from "../../../../../core/entity/Entity";
import { V } from "../../../../../core/Vector";
import Furniture from "../../../../entities/Furniture";
import { PointLight } from "../../../../lighting/PointLight";
import { bathroomTiles, produceStall } from "../../../../view/DecorationSprite";
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

    entities.push(new Furniture(transformCell(V(0.63, 0.28)), produceStall));
    const light = new PointLight(6, 0.6);
    light.setPosition(transformCell(V(1, 1)));
    entities.push(light);

    return entities;
  }
}

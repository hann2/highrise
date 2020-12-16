import Entity from "../../../../../core/entity/Entity";
import { V } from "../../../../../core/Vector";
import Furniture from "../../../../entities/environment/Furniture";
import { PointLight } from "../../../../lighting/PointLight";
import {
  bathroomTiles,
  housePlantShort1,
  housePlantShort2,
  housePlantTall1,
  housePlantTall2,
  housePlantTall3,
  vaseEmpty,
  vaseRose,
  vaseRoses,
  vaseTulips,
} from "../../../../entities/environment/decorations";
import { AngleTransformer, CellTransformer } from "../ElementTransformer";
import RoomTemplate from "../RoomTemplate";

export default class Florist extends RoomTemplate {
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

    entities.push(new Furniture(transformCell(V(0.28, 0.28)), vaseEmpty));
    entities.push(new Furniture(transformCell(V(1.4, -0.15)), vaseRose));
    entities.push(new Furniture(transformCell(V(2.1, -0.15)), vaseRoses));
    entities.push(new Furniture(transformCell(V(2.1, -0.15)), vaseTulips));
    entities.push(
      new Furniture(transformCell(V(2.1, -0.15)), housePlantShort1)
    );
    entities.push(
      new Furniture(transformCell(V(2.1, -0.15)), housePlantShort2)
    );
    entities.push(new Furniture(transformCell(V(2.1, -0.15)), housePlantTall1));
    entities.push(new Furniture(transformCell(V(2.1, -0.15)), housePlantTall2));
    entities.push(new Furniture(transformCell(V(2.1, -0.15)), housePlantTall3));
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

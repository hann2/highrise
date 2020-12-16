import Entity from "../../../../core/entity/Entity";
import { choose } from "../../../../core/util/Random";
import { V } from "../../../../core/Vector";
import {
  bathroomTiles,
  sink1,
  toilet1,
  toilet2,
  toilet3,
  toilet4,
} from "../../../entities/environment/decorations";
import Furniture from "../../../entities/environment/Furniture";
import { PointLight } from "../../../lighting/PointLight";
import { AngleTransformer, CellTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

export default class BathroomTemplate extends RoomTemplate {
  constructor() {
    super(V(2, 3), [[V(-1, 0), true]], bathroomTiles);
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    const doorOpenDirection = transformCell(V(1, 0)).sub(transformCell(V(0, 0)))
      .angle;

    // This is either a black-seat bathroom or a white-seat bathroom
    const toiletSet = choose([toilet1, toilet2], [toilet3, toilet4]);

    for (const toiletPosition of [
      V(0.375, 0),
      V(0.375, 0.5),
      V(0.375, 1),
      V(0.375, 1.5),
      V(0.375, 2),
    ]) {
      const angle = doorOpenDirection + Math.PI * 2;
      const p = transformCell(toiletPosition);
      const sprite = choose(...toiletSet);
      entities.push(new Furniture(p, sprite, angle));
    }

    for (const sinkPosition of [V(2 - 0.375, 1), V(2 - 0.375, 2)]) {
      const angle = doorOpenDirection;
      const p = transformCell(sinkPosition);
      entities.push(new Furniture(p, sink1, angle));
    }

    entities.push(
      new PointLight({
        radius: 7,
        intensity: 0.8,
        color: 0xfaf0e6,
        shadowsEnabled: true,
        position: transformCell(V(0.5, 1)),
      })
    );

    return entities;
  }
}

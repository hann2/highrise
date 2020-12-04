import Entity from "../../../core/entity/Entity";
import { polarToVec } from "../../../core/util/MathUtil";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Decoration from "../../entities/Decoration";
import {
  bathroomTiles,
  downSink1,
  downSink2,
  downToilet1,
  downToilet2,
  leftSink1,
  leftToilet1,
  leftToilet2,
  rightSink1,
  rightToilet1,
  rightToilet2,
} from "../../view/DecorationSprite";
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

    const addToiletAt = (p: V2d) => {
      const vec = polarToVec(transformAngle(0), 1);
      if (vec.x === 1) {
        entities.push(
          new Decoration(
            transformCell(p).add(V(0.4, 0)),
            choose(leftToilet1, leftToilet2)
          )
        );
      } else if (vec.x === -1) {
        entities.push(
          new Decoration(
            transformCell(p).add(V(-0.4, 0)),
            choose(rightToilet1, rightToilet2)
          )
        );
      } else if (vec.y === -1) {
        entities.push(
          new Decoration(
            transformCell(p).add(V(0, -0.4)),
            choose(downToilet1, downToilet2)
          )
        );
      }
    };

    const addSinkAt = (p: V2d) => {
      const vec = polarToVec(transformAngle(0), 1);
      if (vec.x === 1) {
        entities.push(
          new Decoration(transformCell(p).add(V(-0.5, 0)), rightSink1)
        );
      } else if (vec.x === -1) {
        entities.push(
          new Decoration(transformCell(p).add(V(0.5, 0)), leftSink1)
        );
      } else if (vec.y === 1) {
        entities.push(
          new Decoration(
            transformCell(p).add(V(0, -0.6)),
            choose(downSink1, downSink2)
          )
        );
      }
    };

    addSinkAt(V(0, 1));
    addSinkAt(V(0, 2));
    addToiletAt(V(1, 0));
    addToiletAt(V(1, 1));
    addToiletAt(V(1, 2));

    return entities;
  }
}

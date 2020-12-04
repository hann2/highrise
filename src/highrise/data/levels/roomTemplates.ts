import Entity from "../../../core/entity/Entity";
import { polarToVec } from "../../../core/util/MathUtil";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Decoration from "../../entities/Decoration";
import Zombie from "../../entities/Zombie";
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
import RoomTemplate from "./RoomTemplate";

const zombieRoomDimensions = V(3, 2);
export const zombieRoomTemplate: RoomTemplate = new RoomTemplate(
  zombieRoomDimensions,
  [
    [V(-1, 1), true],
    [V(2, -1), false],
  ],
  (transformCell) => {
    const zombies: Entity[] = [];
    for (let i = 0; i < zombieRoomDimensions.x; i++) {
      for (let j = 0; j < zombieRoomDimensions.y; j++) {
        zombies.push(new Zombie(transformCell(V(i, j).add(V(0.25, 0.25)))));
        zombies.push(new Zombie(transformCell(V(i, j).add(V(-0.25, 0.25)))));
        zombies.push(new Zombie(transformCell(V(i, j).add(V(0.25, -0.25)))));
        zombies.push(new Zombie(transformCell(V(i, j).add(V(-0.25, -0.25)))));
      }
    }
    return zombies;
  }
);

export const bathroomTemplate: RoomTemplate = new RoomTemplate(
  V(2, 3),
  [[V(-1, 0), true]],
  (transformCell, transformAngle) => {
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
  },
  bathroomTiles
);

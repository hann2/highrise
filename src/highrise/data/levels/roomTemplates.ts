import { polarToVec } from "../../../core/util/MathUtil";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Decoration from "../../entities/Decoration";
import Zombie from "../../entities/Zombie";
import {
  downSink1,
  downSink2,
  downToilet1,
  downToilet2,
  leftSink1,
  leftToilet1,
  rightSink1,
  rightToilet1,
} from "../../view/DecorationSprite";
import RoomTemplate, { EntityGenerator } from "./RoomTemplate";

const dimensions = V(3, 2);
const zombieRoomEntityGenerators: EntityGenerator[] = [];
for (let i = 0; i < dimensions.x; i++) {
  for (let j = 0; j < dimensions.y; j++) {
    zombieRoomEntityGenerators.push(
      (transformCell) => new Zombie(transformCell(V(i, j).add(V(0.25, 0.25))))
    );
    zombieRoomEntityGenerators.push(
      (transformCell) => new Zombie(transformCell(V(i, j).add(V(-0.25, 0.25))))
    );
    zombieRoomEntityGenerators.push(
      (transformCell) => new Zombie(transformCell(V(i, j).add(V(0.25, -0.25))))
    );
    zombieRoomEntityGenerators.push(
      (transformCell) => new Zombie(transformCell(V(i, j).add(V(-0.25, -0.25))))
    );
  }
}

export const zombieRoomTemplate: RoomTemplate = new RoomTemplate(
  dimensions,
  [
    [V(-1, 1), true],
    [V(2, -1), false],
  ],
  zombieRoomEntityGenerators
);

const addSinkAt = (p: V2d): EntityGenerator => (
  transformCell,
  transformAngle
) => {
  const vec = polarToVec(transformAngle(0), 1);
  if (vec.x === 1) {
    return new Decoration(transformCell(p), rightSink1);
  } else if (vec.x === -1) {
    return new Decoration(transformCell(p), leftSink1);
  } else if (vec.y === 1) {
    return new Decoration(transformCell(p), choose(downSink1, downSink2));
  }
};

const atToiletAt = (p: V2d): EntityGenerator => (
  transformCell,
  transformAngle
) => {
  const vec = polarToVec(transformAngle(0), 1);
  if (vec.x === 1) {
    return new Decoration(transformCell(p), leftToilet1);
  } else if (vec.x === -1) {
    return new Decoration(transformCell(p), rightToilet1);
  } else if (vec.y === -1) {
    return new Decoration(transformCell(p), choose(downToilet1, downToilet2));
  }
};

export const bathroomTemplate: RoomTemplate = new RoomTemplate(
  V(2, 3),
  [[V(-1, 0), true]],
  [
    addSinkAt(V(0, 1)),
    addSinkAt(V(0, 2)),
    atToiletAt(V(1, 0)),
    atToiletAt(V(1, 1)),
    atToiletAt(V(1, 2)),
  ]
);

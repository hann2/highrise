import Entity from "../../../core/entity/Entity";
import { V, V2d } from "../../../core/Vector";
import Zombie from "../../enemies/zombie/Zombie";
import { PointLight } from "../../lighting-and-vision/PointLight";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import {
  AngleTransformer,
  DimensionsTransformer,
  PositionTransformer,
  VectorTransformer,
  WallTransformer,
} from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "./roomUtils";

const DIMENSIONS = V(3, 2);
const DOORS: WallID[] = [
  [V(-1, 1), true],
  [V(2, -1), false],
];

export default class ZombieRoomTemplate implements RoomTemplate {
  getOccupiedCells(): V2d[] {
    return defaultOccupiedCells(DIMENSIONS, DOORS);
  }

  generateWalls(): WallBuilder[] {
    return defaultWalls(DIMENSIONS, DOORS);
  }

  generateDoors(): DoorBuilder[] {
    return defaultDoors(DOORS);
  }

  generateEntities(
    roomToWorldPosition: PositionTransformer,
    roomToWorldVector: VectorTransformer,
    roomToWorldAngle: AngleTransformer,
    roomToLevelWall: WallTransformer,
    roomToWorldDimensions: DimensionsTransformer
  ): Entity[] {
    const entities: Entity[] = [];
    for (let i = 0; i < DIMENSIONS.x; i++) {
      for (let j = 0; j < DIMENSIONS.y; j++) {
        const p = V(i, j);
        entities.push(new Zombie(roomToWorldPosition(p.add(V(0.25, 0.25)))));
        entities.push(new Zombie(roomToWorldPosition(p.add(V(-0.25, 0.25)))));
        entities.push(new Zombie(roomToWorldPosition(p.add(V(0.25, -0.25)))));
        entities.push(new Zombie(roomToWorldPosition(p.add(V(-0.25, -0.25)))));
      }
    }
    entities.push(
      new PointLight({
        radius: 4,
        intensity: 0.8,
        color: 0xb0e0e6,
        position: roomToWorldPosition(V(0.5, 0.5)),
      })
    );
    entities.push(
      new PointLight({
        radius: 4,
        intensity: 0.8,
        color: 0xb0e0e6,
        position: roomToWorldPosition(V(1.5, 0.5)),
      })
    );
    return entities;
  }
}

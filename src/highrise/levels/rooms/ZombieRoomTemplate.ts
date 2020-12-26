import Entity from "../../../core/entity/Entity";
import { V, V2d } from "../../../core/Vector";
import Zombie from "../../enemies/zombie/Zombie";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
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
  constructor(private levelIndex: number) {}

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
        if (this.levelIndex > 1) {
          entities.push(new Zombie(roomToWorldPosition(p.add(V(0.25, 0.25)))));
        }
        if (this.levelIndex > 2) {
          entities.push(new Zombie(roomToWorldPosition(p.add(V(-0.25, 0.25)))));
        }
        if (this.levelIndex > 3) {
          entities.push(new Zombie(roomToWorldPosition(p.add(V(0.25, -0.25)))));
        }
        if (this.levelIndex > 4) {
          entities.push(
            new Zombie(roomToWorldPosition(p.add(V(-0.25, -0.25))))
          );
        }
      }
    }
    entities.push(
      new OverheadLight(roomToWorldPosition(V(0.5, 0.5)), {
        radius: 4,
        intensity: 0.8,
        color: 0xb0e0e6,
      })
    );
    entities.push(
      new OverheadLight(roomToWorldPosition(V(1.5, 0.5)), {
        radius: 4,
        intensity: 0.8,
        color: 0xb0e0e6,
      })
    );
    return entities;
  }
}

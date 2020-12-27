import Entity from "../../../core/entity/Entity";
import { V, V2d } from "../../../core/Vector";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import { RoomTransformer } from "./ElementTransformer";
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

  generateEntities({ roomToWorldPosition }: RoomTransformer): Entity[] {
    const entities: Entity[] = [];
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

  getEnemyPositions({ roomToWorldPosition }: RoomTransformer): V2d[] {
    const positions: V2d[] = [];
    for (let i = 0; i < DIMENSIONS.x; i++) {
      for (let j = 0; j < DIMENSIONS.y; j++) {
        const p = V(i, j);
        positions.push(roomToWorldPosition(p.add(V(0.25, 0.25))));
        positions.push(roomToWorldPosition(p.add(V(-0.25, 0.25))));
        positions.push(roomToWorldPosition(p.add(V(0.25, -0.25))));
        positions.push(roomToWorldPosition(p.add(V(-0.25, -0.25))));
      }
    }
    return positions;
  }
}

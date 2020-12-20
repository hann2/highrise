import Entity from "../../../../core/entity/Entity";
import { V, V2d } from "../../../../core/Vector";
import Decoration from "../../../environment/Decoration";
import {
  bathroomTilesFloor5,
  jewelryStall,
  shelfEmpty,
  shelfJars,
} from "../../../environment/decorations/decorations";
import RepeatingFloor from "../../../environment/RepeatingFloor";
import { PointLight } from "../../../lighting-and-vision/PointLight";
import {
  DoorBuilder,
  WallBuilder,
  WallID,
} from "../../level-generation/CellGrid";
import {
  AngleTransformer,
  DimensionsTransformer,
  PositionTransformer,
  VectorTransformer,
  WallTransformer,
} from "../ElementTransformer";
import RoomTemplate from "../RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "../roomUtils";

const DIMENSIONS = V(3, 3);
const DOORS: WallID[] = [
  [V(2, 1), true],
  [V(1, 2), false],
  [V(-1, 2), true],
];

export default class Jeweler implements RoomTemplate {
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

    entities.push(
      new Decoration(roomToWorldPosition(V(0.28, 0.28)), jewelryStall)
    );
    entities.push(
      new Decoration(roomToWorldPosition(V(1.4, -0.15)), shelfEmpty)
    );
    entities.push(
      new Decoration(roomToWorldPosition(V(2.1, -0.15)), shelfJars)
    );
    entities.push(
      new PointLight({
        radius: 6,
        intensity: 0.6,
        position: roomToWorldPosition(V(1, 1)),
      })
    );
    const centerWorldCoords = roomToWorldPosition(
      DIMENSIONS.sub(V(1, 1)).mul(0.5)
    );
    const dimensionsWorldCoords = roomToWorldDimensions(DIMENSIONS);
    entities.push(
      new RepeatingFloor(
        bathroomTilesFloor5,
        centerWorldCoords.sub(dimensionsWorldCoords.mul(0.5)),
        dimensionsWorldCoords
      )
    );

    return entities;
  }
}

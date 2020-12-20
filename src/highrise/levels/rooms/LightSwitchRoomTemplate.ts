import img_transformer from "../../../../resources/images/environment/maintenance/transformer.png";
import Entity from "../../../core/entity/Entity";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Decoration from "../../environment/Decoration";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import { SparkGenerator } from "../../environment/lighting/SparkGenerator";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
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

const DIMENSIONS = V(3, 3);
const DOORS: WallID[] = [
  [V(1, -1), false],
  [V(1, 2), false],
];

export default class LightSwitchRoomTemplate implements RoomTemplate {
  constructor(public floor: DecorationInfo) {}

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
      new Decoration(roomToWorldPosition(V(1, 1)), {
        imageName: img_transformer,
        heightMeters: 2,
        isSolid: true,
        rotation: choose(...CARDINAL_DIRECTIONS_VALUES).angle,
      })
    );
    const centerWorldCoords = roomToWorldPosition(
      DIMENSIONS.sub(V(1, 1)).mul(0.5)
    );
    const dimensionsWorldCoords = roomToWorldDimensions(DIMENSIONS);
    entities.push(
      new RepeatingFloor(
        this.floor,
        centerWorldCoords.sub(dimensionsWorldCoords.mul(0.5)),
        dimensionsWorldCoords
      )
    );
    entities.push(new SparkGenerator(roomToWorldPosition(V(1, 1))));
    return entities;
  }
}

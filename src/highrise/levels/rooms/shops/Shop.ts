import Entity from "../../../../core/entity/Entity";
import { hsvToRgb, rgbToHex } from "../../../../core/util/ColorUtils";
import { choose, rCardinal, rUniform } from "../../../../core/util/Random";
import { V, V2d } from "../../../../core/Vector";
import Decoration from "../../../environment/Decoration";
import { DecorationInfo } from "../../../environment/decorations/DecorationInfo";
import {
  bathroomTilesFloor2,
  carpetFloor1,
  carpetFloor2,
  counter1,
  counter2,
  counter3,
  shopShelf1,
  tilesFloor13,
  tilesFloor14,
  woodFloor1,
  woodFloor2,
  woodFloor3,
  woodFloor4,
} from "../../../environment/decorations/decorations";
import { OverheadLight } from "../../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../../environment/RepeatingFloor";
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

const FLOOR_CHOICES = [
  carpetFloor1,
  carpetFloor2,
  woodFloor1,
  woodFloor2,
  woodFloor3,
  woodFloor4,
  bathroomTilesFloor2,
  tilesFloor13,
  tilesFloor14,
];

export default class Shop implements RoomTemplate {
  constructor(private outsideFloor: DecorationInfo) {}

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

    const counter = choose(counter1, counter2, counter3);
    entities.push(
      new Decoration(
        roomToWorldPosition(V(0.5, 0.25)),
        counter,
        roomToWorldAngle(0)
      )
    );

    entities.push(
      new Decoration(
        roomToWorldPosition(V(0.5, 1.7)),
        shopShelf1,
        roomToWorldAngle(0)
      )
    );
    entities.push(
      new Decoration(
        roomToWorldPosition(V(1.5, 1.7)),
        shopShelf1,
        roomToWorldAngle(0)
      )
    );

    entities.push(
      new OverheadLight(roomToWorldPosition(V(1, 1)), {
        radius: 6,
        intensity: 0.6,
      })
    );
    const centerWorldCoords = roomToWorldPosition(
      DIMENSIONS.sub(V(1, 1)).mul(0.5)
    );
    const dimensionsWorldCoords = roomToWorldDimensions(DIMENSIONS);

    const floorInfo = {
      ...choose(
        ...FLOOR_CHOICES.filter(
          (f) => f.imageName != this.outsideFloor.imageName
        )
      ),
      rotation: rCardinal(),
    };

    const floor = new RepeatingFloor(
      floorInfo,
      centerWorldCoords.sub(dimensionsWorldCoords.mul(0.5)),
      dimensionsWorldCoords
    );
    if (
      floorInfo.imageName == carpetFloor1.imageName ||
      floorInfo.imageName == carpetFloor2.imageName
    ) {
      floor.sprite.tint = rgbToHex(
        hsvToRgb({ h: rUniform(0, 1), s: 0.6, v: 0.7 })
      );
    }

    entities.push(floor);

    return entities;
  }
}

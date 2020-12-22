import Entity from "../../../core/entity/Entity";
import { degToRad } from "../../../core/util/MathUtil";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CELL_WIDTH } from "../../constants/constants";
import Heavy from "../../enemies/heavy/Heavy";
import Decoration from "../../environment/Decoration";
import {
  endTable1,
  endTable2,
  fancyChair1,
  fancyCoffeeTable1,
  lobbyDesk,
  redCarpetBottom,
  redCarpetCenter,
  redCarpetInnerBottomLeft,
  redCarpetInnerBottomRight,
  redCarpetInnerTopLeft,
  redCarpetInnerTopRight,
  redCarpetLeft,
  redCarpetLowerLeft,
  redCarpetLowerRight,
  redCarpetRight,
  redCarpetTop,
  redCarpetUpperLeft,
  redCarpetUpperRight,
  rug,
} from "../../environment/decorations/decorations";
import { DirectionalSprite } from "../../environment/decorations/DirectionalSprite";
import ElevatorDoor from "../../environment/ElevatorDoor";
import { Piano } from "../../environment/furniture-plus/Piano";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import TiledFloor, { Tiles } from "../../environment/TiledFloor";
import { PointLight } from "../../lighting-and-vision/PointLight";
import { CARDINAL_DIRECTIONS, Direction } from "../../utils/directions";
import CellGrid, {
  DoorBuilder,
  WallBuilder,
  WallID,
} from "../level-generation/CellGrid";
import {
  AngleTransformer,
  DimensionsTransformer,
  PositionTransformer,
  VectorTransformer,
  WallTransformer,
} from "./ElementTransformer";
import {
  doubleResolution,
  fillFloorWithBorders,
  FloorMask,
  insetBorders,
} from "./floorUtils";
import RoomTemplate from "./RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "./roomUtils";

const directionalCarpet: DirectionalSprite = {
  baseSprites: {
    RIGHT: redCarpetRight,
    DOWN: redCarpetBottom,
    LEFT: redCarpetLeft,
    UP: redCarpetTop,
    RIGHTUP: redCarpetUpperRight,
    RIGHTDOWN: redCarpetLowerRight,
    LEFTUP: redCarpetUpperLeft,
    LEFTDOWN: redCarpetLowerLeft,
    CENTER: redCarpetCenter,
  },
  insideCorners: {
    RIGHTUP: redCarpetInnerTopRight,
    RIGHTDOWN: redCarpetInnerBottomRight,
    LEFTUP: redCarpetInnerTopLeft,
    LEFTDOWN: redCarpetInnerBottomLeft,
  },
};

interface Elevator {
  cell: V2d;
  openDirection: keyof typeof Direction;
}

const ELEVATORS: Elevator[] = [
  { cell: V(0, 0), openDirection: "RIGHT" },
  { cell: V(0, 1), openDirection: "RIGHT" },
  { cell: V(0, 2), openDirection: "RIGHT" },
  { cell: V(2, 0), openDirection: "LEFT" },
  { cell: V(2, 1), openDirection: "LEFT" },
  { cell: V(2, 2), openDirection: "LEFT" },
  { cell: V(3, 0), openDirection: "RIGHT" },
  { cell: V(3, 1), openDirection: "RIGHT" },
  { cell: V(3, 2), openDirection: "RIGHT" },
  { cell: V(5, 0), openDirection: "LEFT" },
  { cell: V(5, 1), openDirection: "LEFT" },
  { cell: V(5, 2), openDirection: "LEFT" },
];

const DIMENSIONS = V(6, 7);
const DOORS: WallID[] = [
  [V(-1, 4), true],
  [V(5, 4), true],
];

export default class LobbyRoomTemplate implements RoomTemplate {
  getOccupiedCells(): V2d[] {
    return defaultOccupiedCells(DIMENSIONS, DOORS);
  }

  generateWalls(): WallBuilder[] {
    const walls = defaultWalls(DIMENSIONS, DOORS);

    // We are adding some walls twice.  probably ok?
    for (const e of ELEVATORS) {
      for (const direction of CARDINAL_DIRECTIONS) {
        if (direction !== e.openDirection) {
          walls.push({
            exists: true,
            destructible: false,
            id: CellGrid.getWallInDirection(e.cell, Direction[direction]),
            chainLink: false,
          });
        }
      }
    }

    return walls;
  }

  generateDoors(): DoorBuilder[] {
    return defaultDoors(DOORS);
  }

  generateFloorMask(): FloorMask {
    const lowResolutionFloorMask: FloorMask = [];
    for (let i = 0; i < DIMENSIONS.x; i++) {
      lowResolutionFloorMask[i] = [];
      for (let j = 0; j < DIMENSIONS.y; j++) {
        lowResolutionFloorMask[i][j] = true;
      }
    }
    ELEVATORS.forEach(
      (e) => (lowResolutionFloorMask[e.cell.x][e.cell.y] = false)
    );
    return doubleResolution(doubleResolution(lowResolutionFloorMask));
  }

  generateEntities(
    roomToWorldPosition: PositionTransformer,
    roomToWorldVector: VectorTransformer,
    roomToWorldAngle: AngleTransformer,
    roomToLevelWall: WallTransformer,
    roomToWorldDimensions: DimensionsTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    const carpetScale = redCarpetUpperLeft.heightMeters / CELL_WIDTH;
    const floorMask = this.generateFloorMask();

    const mainTiles: Tiles = insetBorders(
      fillFloorWithBorders(floorMask, directionalCarpet),
      directionalCarpet
    );

    const elevatorTiles = insetBorders(
      fillFloorWithBorders(
        doubleResolution(doubleResolution([[true]])),
        directionalCarpet
      ),
      directionalCarpet
    );

    const tileScale = V(carpetScale * CELL_WIDTH, carpetScale * CELL_WIDTH);

    entities.push(
      new TiledFloor(roomToWorldPosition(V(-0.5, -0.5)), tileScale, mainTiles)
    );

    ELEVATORS.forEach((e) => {
      entities.push(
        new TiledFloor(
          roomToWorldPosition(e.cell.add(V(-0.5, -0.5))),
          tileScale,
          elevatorTiles
        )
      );

      entities.push(
        new PointLight({
          radius: 5,
          shadowsEnabled: true,
          position: roomToWorldPosition(e.cell),
        })
      );

      const doorDimensionsLevelCoords = V(0.25 / CELL_WIDTH, 1);
      const doorDimensionsWorldCoords = doorDimensionsLevelCoords.mul(
        CELL_WIDTH
      );
      const doorUpperLeftCorner = e.cell
        .add(Direction[e.openDirection].mul(0.5))
        .sub(doorDimensionsLevelCoords.mul(0.5));

      entities.push(
        new ElevatorDoor(
          roomToWorldPosition(doorUpperLeftCorner),
          doorDimensionsWorldCoords,
          true
        )
      );
    });

    entities.push(
      new Decoration(roomToWorldPosition(V(2.5, 4.5)), rug, degToRad(90))
    );
    entities.push(new Heavy(roomToWorldPosition(V(2.5, 3)))); // Hello my name is Bob, the wifi password is BRAIINNNNSS!
    entities.push(new Decoration(roomToWorldPosition(V(2.5, 3.5)), lobbyDesk));
    entities.push(
      new Decoration(
        roomToWorldPosition(V(-0.15, 5)),
        fancyChair1,
        degToRad(90)
      )
    );
    entities.push(
      new Decoration(
        roomToWorldPosition(V(-0.15, 5.47)),
        fancyChair1,
        degToRad(90)
      )
    );
    entities.push(new Decoration(roomToWorldPosition(V(0.35, 6)), fancyChair1));
    entities.push(new Decoration(roomToWorldPosition(V(0.85, 6)), fancyChair1));
    entities.push(
      new Decoration(
        roomToWorldPosition(V(-0.15, 6)),
        choose(endTable1, endTable2)
      )
    );
    entities.push(
      new Decoration(roomToWorldPosition(V(0.6, 5)), fancyCoffeeTable1)
    );

    entities.push(new Piano(roomToWorldPosition(V(4.2, 5.15)), degToRad(-35)));

    entities.push(
      new OverheadLight(roomToWorldPosition(V(1, 1)), { radius: 10 })
    );
    entities.push(
      new OverheadLight(roomToWorldPosition(V(4, 1)), { radius: 10 })
    );
    entities.push(
      new OverheadLight(roomToWorldPosition(V(1, 4)), { radius: 10 })
    );
    entities.push(
      new OverheadLight(roomToWorldPosition(V(4, 4)), { radius: 10 })
    );

    return entities;
  }
}

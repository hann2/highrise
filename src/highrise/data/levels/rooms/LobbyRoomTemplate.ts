import Entity from "../../../../core/entity/Entity";
import { choose } from "../../../../core/util/Random";
import { V, V2d } from "../../../../core/Vector";
import Decoration from "../../../entities/environment/Decoration";
import ElevatorDoor from "../../../entities/environment/ElevatorDoor";
import TiledFloor, { Tiles } from "../../../entities/environment/TiledFloor";
import Furniture from "../../../entities/environment/Furniture";
import { PointLight } from "../../../lighting/PointLight";
import { CARDINAL_DIRECTIONS, Direction } from "../../../utils/directions";
import {
  chairRight,
  chairUp,
  coffeeTable,
  endTable1,
  endTable2,
  lobbyDesk,
  piano,
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
} from "../../../entities/environment/decorations";
import { DirectionalSprite } from "../../../entities/environment/decorations/DirectionalSprite";
import { CELL_WIDTH, getWallInDirection, WallID } from "../levelGeneration";
import {
  AngleTransformer,
  CellTransformer,
  WallTransformer,
} from "./ElementTransformer";
import {
  doubleResolution,
  fillFloorWithBorders,
  FloorMask,
  insetBorders,
} from "./floorUtils";
import RoomTemplate from "./RoomTemplate";

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

export default class LobbyRoomTemplate extends RoomTemplate {
  constructor() {
    super(V(6, 7), [
      [V(-1, 4), true],
      [V(5, 4), true],
    ]);
  }

  generateWalls(transformWall: WallTransformer): WallID[] {
    const walls: WallID[] = [];
    for (const elevator of ELEVATORS) {
      for (const direction of CARDINAL_DIRECTIONS) {
        if (direction !== elevator.openDirection) {
          walls.push(
            transformWall(
              getWallInDirection(elevator.cell, Direction[direction])
            )
          );
        }
      }
    }
    return walls;
  }

  generateFloorMask(): FloorMask {
    const lowResolutionFloorMask: FloorMask = [];
    for (let i = 0; i < this.dimensions.x; i++) {
      lowResolutionFloorMask[i] = [];
      for (let j = 0; j < this.dimensions.y; j++) {
        lowResolutionFloorMask[i][j] = true;
      }
    }
    ELEVATORS.forEach(
      (e) => (lowResolutionFloorMask[e.cell.x][e.cell.y] = false)
    );
    return doubleResolution(doubleResolution(lowResolutionFloorMask));
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
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
      new TiledFloor(transformCell(V(-0.5, -0.5)), tileScale, mainTiles)
    );

    ELEVATORS.forEach((e) => {
      entities.push(
        new TiledFloor(
          transformCell(e.cell.add(V(-0.5, -0.5))),
          tileScale,
          elevatorTiles
        )
      );

      entities.push(
        new PointLight({
          radius: 5,
          shadowsEnabled: true,
          position: transformCell(e.cell),
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
          transformCell(doorUpperLeftCorner),
          doorDimensionsWorldCoords,
          true
        )
      );
    });

    entities.push(new Decoration(transformCell(V(2.5, 5)), rug));
    entities.push(new Furniture(transformCell(V(2.5, 3.5)), lobbyDesk));
    entities.push(new Furniture(transformCell(V(-0.15, 5)), chairRight));
    entities.push(new Furniture(transformCell(V(-0.15, 5.47)), chairRight));
    entities.push(new Furniture(transformCell(V(0.35, 6)), chairUp));
    entities.push(new Furniture(transformCell(V(0.85, 6)), chairUp));
    entities.push(
      new Furniture(transformCell(V(-0.15, 6.15)), choose(endTable1, endTable2))
    );
    entities.push(new Furniture(transformCell(V(0.6, 5)), coffeeTable));

    entities.push(new Furniture(transformCell(V(4.5, 5.5)), piano));

    entities.push(
      new PointLight({
        radius: 10,
        shadowsEnabled: true,
        position: transformCell(V(1, 1)),
      })
    );

    entities.push(
      new PointLight({
        radius: 10,
        shadowsEnabled: true,
        position: transformCell(V(4, 1)),
      })
    );

    entities.push(
      new PointLight({
        radius: 10,
        shadowsEnabled: true,
        position: transformCell(V(1, 4)),
      })
    );

    entities.push(
      new PointLight({
        radius: 10,
        shadowsEnabled: true,
        position: transformCell(V(4, 4)),
      })
    );

    return entities;
  }
}

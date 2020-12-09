import Entity from "../../../../core/entity/Entity";
import { choose } from "../../../../core/util/Random";
import { V } from "../../../../core/Vector";
import Decoration from "../../../entities/Decoration";
import TiledFloor, { Tiles } from "../../../entities/environment/TiledFloor";
import Furniture from "../../../entities/Furniture";
import { PointLight } from "../../../lighting/PointLight";
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
} from "../../../view/DecorationSprite";
import { DirectionalSprite } from "../../../view/DirectionalSprite";
import { CELL_WIDTH, WallID } from "../levelGeneration";
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

const directionalRug: DirectionalSprite = {
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

export default class LobbyRoomTemplate extends RoomTemplate {
  constructor() {
    super(V(6, 7), [
      [V(-1, 4), true],
      [V(5, 4), true],
    ]);
  }

  generateWalls(transformWall: WallTransformer): WallID[] {
    return [
      transformWall([V(0, 0), false]),
      transformWall([V(0, 1), false]),
      transformWall([V(0, 2), false]),
      transformWall([V(2, 0), false]),
      transformWall([V(2, 1), false]),
      transformWall([V(2, 2), false]),
      transformWall([V(3, 0), false]),
      transformWall([V(3, 1), false]),
      transformWall([V(3, 2), false]),
      transformWall([V(5, 0), false]),
      transformWall([V(5, 1), false]),
      transformWall([V(5, 2), false]),
      transformWall([V(2, 0), true]),
      transformWall([V(2, 1), true]),
      transformWall([V(2, 2), true]),
    ];
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    const carpetScale = redCarpetUpperLeft.heightMeters / CELL_WIDTH;

    const elevatorLocations = [];
    for (let j = 0; j < 3; j++) {
      elevatorLocations.push(V(0, j));
      elevatorLocations.push(V(2, j));
      elevatorLocations.push(V(3, j));
      elevatorLocations.push(V(5, j));
    }

    const lowResolutionFloorMask: FloorMask = [];
    for (let i = 0; i < this.dimensions.x; i++) {
      lowResolutionFloorMask[i] = [];
      for (let j = 0; j < this.dimensions.y; j++) {
        lowResolutionFloorMask[i][j] = true;
      }
    }

    elevatorLocations.forEach(
      (p) => (lowResolutionFloorMask[p.x][p.y] = false)
    );

    const floorMask = doubleResolution(
      doubleResolution(lowResolutionFloorMask)
    );

    const mainTiles: Tiles = insetBorders(
      fillFloorWithBorders(floorMask, directionalRug),
      directionalRug
    );

    const elevatorTiles = insetBorders(
      fillFloorWithBorders(
        doubleResolution(doubleResolution([[true]])),
        directionalRug
      ),
      directionalRug
    );

    const tileScale = V(carpetScale * CELL_WIDTH, carpetScale * CELL_WIDTH);

    entities.push(
      new TiledFloor(transformCell(V(-0.5, -0.5)), tileScale, mainTiles)
    );

    elevatorLocations.forEach((p) =>
      entities.push(
        new TiledFloor(
          transformCell(p.add(V(-0.5, -0.5))),
          tileScale,
          elevatorTiles
        )
      )
    );

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

    const l1 = new PointLight(10);
    l1.setPosition(transformCell(V(0, 0)));
    entities.push(l1);

    return entities;
  }
}

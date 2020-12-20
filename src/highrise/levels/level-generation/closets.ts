import Entity from "../../../core/entity/Entity";
import { choose, seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CELL_WIDTH, LEVEL_SIZE } from "../../constants";
import Decoration from "../../environment/Decoration";
import {
  bookcase1,
  bookcase2,
  boxPile1,
  boxPile2,
  boxShelf1,
  boxShelf2,
  sack,
} from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { PointLight } from "../../lighting-and-vision/PointLight";
import { CARDINAL_DIRECTIONS_VALUES, Direction } from "../../utils/directions";
import LevelTemplate from "../level-templates/LevelTemplate";
import CellGrid, { Closet } from "./CellGrid";
import { wallIDToDoorBuilder } from "./doors";

export function generateClosets(cellGrid: CellGrid): Closet[] {
  const closets: Closet[] = [];
  for (let i = 0; i < LEVEL_SIZE; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      if (cellGrid.cells[i][j].content) {
        continue;
      }

      const backCell = V(i, j);

      let openDirection;
      let backFound = 0;
      for (const direction of CARDINAL_DIRECTIONS_VALUES) {
        let wall = CellGrid.getWallInDirection(backCell, direction);
        if (!cellGrid.isExisting(wall)) {
          backFound += 1;
          openDirection = direction;
        }
      }
      if (backFound !== 1 || !openDirection) {
        continue;
      }

      const frontCell = backCell.add(openDirection);
      if (cellGrid.cells[frontCell.x][frontCell.y].content) {
        continue;
      }

      let directionFromFrontCellToDoorWall;
      let frontFound = 0;
      for (const direction of CARDINAL_DIRECTIONS_VALUES) {
        let wall = CellGrid.getWallInDirection(frontCell, direction);
        if (
          !cellGrid.isExisting(wall) &&
          (direction.x !== -openDirection.x || direction.y != -openDirection.y)
        ) {
          frontFound += 1;
          directionFromFrontCellToDoorWall = direction;
        }
      }
      if (frontFound !== 1 || !directionFromFrontCellToDoorWall) {
        continue;
      }

      const doorWall = CellGrid.getWallInDirection(
        frontCell,
        directionFromFrontCellToDoorWall
      );
      const [cell, right] = doorWall;
      let doorRestingDirection = right ? Direction.DOWN : Direction.RIGHT;
      const reverseHinge =
        doorRestingDirection.x === openDirection.x &&
        doorRestingDirection.y === openDirection.y;
      if (reverseHinge) {
        doorRestingDirection = doorRestingDirection.mul(-1);
      }
      cellGrid.doors.push(wallIDToDoorBuilder(doorWall, reverseHinge));

      cellGrid.cells[frontCell.x][frontCell.y].content = "empty";
      const backWall = CellGrid.getWallInDirection(
        backCell,
        openDirection.mul(-1)
      );
      const closet = {
        backCell,
        frontCell,
        doorWall,
        backWall,
        backWallDirection: openDirection,
      };

      closets.push(closet);
    }
  }

  return closets;
}

export function fillClosets(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate,
  seed: number
): { entities: Entity[]; potentialEnemyLocations: V2d[] } {
  const shuffledClosets: Closet[] = seededShuffle(cellGrid.closets, seed);

  let counter = 0;
  const entities: Entity[] = [];
  const consumeLocation = (f: (l: V2d) => Entity | Entity[]) => {
    const closet = shuffledClosets[counter];
    counter += 1;
    if (!closet) {
      console.warn("Not enough closets in map for all pickups!");
      return;
    }
    cellGrid.cells[closet.backCell[0]][closet.backCell[1]].content = "pickup";
    const location = closet.backCell.add(closet.backWallDirection.mul(0.5));
    entities.push(
      new PointLight({
        radius: CELL_WIDTH * 3,
        intensity: 0.5,
        color: 0xffffff,
        shadowsEnabled: true,
        position: CellGrid.levelCoordToWorldCoord(location),
      })
    );
    const entity = f(CellGrid.levelCoordToWorldCoord(location));
    if (entity instanceof Array) {
      entities.push(...entity);
    } else {
      entities.push(entity);
    }

    const dimensions = V(1, 1)
      .add(
        closet.backWallDirection.y === 1 || closet.backWallDirection.y === -1
          ? V(0, 1)
          : V(1, 0)
      )
      .mul(CELL_WIDTH);
    const upperLeftCell =
      closet.backWallDirection.x === 1 || closet.backWallDirection.y === 1
        ? closet.backCell
        : closet.frontCell;
    const upperLeftCorner = CellGrid.levelCoordToWorldCoord(
      upperLeftCell.sub(V(0.5, 0.5))
    );
    entities.push(
      new RepeatingFloor(
        levelTemplate.getClosetFloor(),
        upperLeftCorner,
        dimensions
      )
    );

    if (counter % 4 === 0) {
      entities.push(
        new Decoration(
          CellGrid.levelCoordToWorldCoord(
            closet.backCell
              .add(closet.backWallDirection.mul(-0.2))
              .add(closet.backWallDirection.rotate90cw().mul(-0.15))
          ),
          sack
        )
      );
    } else if (counter % 4 === 1) {
      entities.push(
        new Decoration(
          CellGrid.levelCoordToWorldCoord(
            closet.backCell.add(closet.backWallDirection.mul(-0.2))
          ),
          choose(boxPile1, boxPile2),
          closet.backWallDirection.angle + Math.PI
        )
      );
    } else if (counter % 4 === 2) {
      entities.push(
        new Decoration(
          CellGrid.levelCoordToWorldCoord(
            closet.backCell.add(
              closet.backWallDirection
                .mul(-0.25)
                .add(
                  closet.backWallDirection
                    .rotate90cw()
                    .mul(choose(-0.1, 0, 0.1))
                )
            )
          ),
          choose(boxShelf1, boxShelf2),
          closet.backWallDirection.angle + Math.PI
        )
      );
    } else {
      entities.push(
        new Decoration(
          CellGrid.levelCoordToWorldCoord(
            closet.backCell.add(closet.backWallDirection.mul(-0.22))
          ),
          choose(bookcase1, bookcase2),
          closet.backWallDirection.angle + Math.PI
        )
      );
    }
  };

  levelTemplate.getPickups().forEach(consumeLocation);

  const potentialEnemyLocations: V2d[] = [];

  for (let i = counter; i < shuffledClosets.length; i++) {
    consumeLocation((l: V2d) => {
      potentialEnemyLocations.push(l);
      return [];
    });
  }

  return { entities, potentialEnemyLocations };
}

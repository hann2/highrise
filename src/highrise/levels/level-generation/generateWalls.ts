import Entity from "../../../core/entity/Entity";
import { V } from "../../../core/Vector";
import { CELL_WIDTH, LEVEL_SIZE } from "../../constants/constants";
import Wall from "../../environment/Wall";
import { ChainLinkFence, SolidWall } from "../../environment/WallTypes";
import CellGrid from "./CellGrid";

// Generate the perimeter walls
export function addOuterWalls(): Entity[] {
  const max = CELL_WIDTH * LEVEL_SIZE;
  return [
    new Wall([0, 0], [max, 0]),
    new Wall([0, 0], [0, max]),
    new Wall([max, 0], [max, max]),
    new Wall([0, max], [max, max]),
  ];
}

export function addInnerWalls(cellGrid: CellGrid): Entity[] {
  const wallEntities = [];

  // Vertical Walls
  for (let i = 0; i < LEVEL_SIZE - 1; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      if (cellGrid.cells[i][j].rightWall.exists) {
        const startJ = j;
        const isChainLink = cellGrid.cells[i][j].rightWall.chainLink;

        // condition for continuing wall
        while (cellGrid.cells[i][j + 1]?.rightWall?.exists) {
          if (cellGrid.cells[i][j + 1].rightWall.chainLink !== isChainLink) {
            break;
          }
          j++;
        }

        const [x1, y1] = CellGrid.levelCoordToWorldCoord(
          V(i + 0.5, startJ - 0.5)
        );
        const [x2, y2] = CellGrid.levelCoordToWorldCoord(V(i + 0.5, j + 0.5));
        const wallType = isChainLink ? ChainLinkFence : SolidWall;
        wallEntities.push(new Wall([x1, y1], [x2, y2], wallType));
      }
    }
  }

  // Horizontal Walls
  for (let j = 0; j < LEVEL_SIZE - 1; j++) {
    for (let i = 0; i < LEVEL_SIZE; i++) {
      if (cellGrid.cells[i][j].bottomWall.exists) {
        const startI = i;
        const isChainLink = cellGrid.cells[i][j].bottomWall.chainLink;

        // condition for continuing wall
        while (cellGrid.cells[i + 1]?.[j]?.bottomWall?.exists) {
          if (cellGrid.cells[i + 1][j].bottomWall.chainLink !== isChainLink) {
            break;
          }
          i++;
        }

        const [x1, y1] = CellGrid.levelCoordToWorldCoord(
          V(startI - 0.5, j + 0.5)
        );
        const [x2, y2] = CellGrid.levelCoordToWorldCoord(V(i + 0.5, j + 0.5));
        const wallType = isChainLink ? ChainLinkFence : SolidWall;
        wallEntities.push(new Wall([x1, y1], [x2, y2], wallType));
      }
    }
  }

  return wallEntities;
}

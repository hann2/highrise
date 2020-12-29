import Entity from "../../../core/entity/Entity";
import { V } from "../../../core/Vector";
import { CELL_SIZE } from "../../constants/constants";
import Wall from "../../environment/Wall";
import { ChainLinkFence, SolidWall } from "../../environment/WallTypes";
import CellGrid from "./CellGrid";

// Generate the perimeter walls
export function addOuterWalls([width, height]: [number, number]): Entity[] {
  const maxX = CELL_SIZE * width;
  const maxY = CELL_SIZE * height;
  return [
    // Top
    new Wall([0, 0], [maxX, 0]),
    // Left
    new Wall([0, 0], [0, maxY]),
    // Right
    new Wall([maxX, 0], [maxX, maxY]),
    // Bottom
    new Wall([0, maxY], [maxX, maxY]),
  ];
}

export function addInnerWalls(cellGrid: CellGrid): Entity[] {
  const wallEntities = [];

  // Vertical Walls
  for (let i = 0; i < cellGrid.width - 1; i++) {
    for (let j = 0; j < cellGrid.height; j++) {
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
  for (let j = 0; j < cellGrid.height - 1; j++) {
    for (let i = 0; i < cellGrid.width; i++) {
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

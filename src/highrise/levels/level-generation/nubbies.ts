import Entity from "../../../core/entity/Entity";
import { choose, rBool } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Decoration from "../../environment/Decoration";
import { waterCooler } from "../../environment/decorations/decorations";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import VendingMachine from "../../environment/VendingMachine";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import CellGrid, { LEVEL_SIZE } from "./CellGrid";

export function fillNubbies(cellGrid: CellGrid): Entity[] {
  const entities: Entity[] = [];

  for (let i = 0; i < LEVEL_SIZE; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      if (cellGrid.cells[i][j].content) {
        continue;
      }
      const cell = V(i, j);

      let openDirection: V2d;
      let found = 0;
      for (const direction of CARDINAL_DIRECTIONS_VALUES) {
        let wall = CellGrid.getWallInDirection(cell, direction);
        if (!cellGrid.isExisting(wall)) {
          found += 1;
          openDirection = direction;
        }
      }
      const isANubby = found === 1;
      if (!isANubby) {
        continue;
      }

      if (isANubby) {
        const content = choose("vending", "water-cooler");
        cellGrid.cells[i][j].content = content;
        const wallDirection = openDirection!;

        if (rBool(0.5)) {
          entities.push(
            new OverheadLight(cellGrid.levelCoordToWorldCoord(cell), {
              intensity: 0.2,
            })
          );
        }

        if (content === "vending") {
          // Fill with vending machine
          const machinePosition = cell.sub(wallDirection.mul(0.1));

          entities.push(
            new VendingMachine(
              cellGrid.levelCoordToWorldCoord(machinePosition),
              wallDirection.angle + Math.PI / 2
            )
          );
        } else if (content === "water-cooler") {
          const machinePosition = cell.sub(wallDirection.mul(0.13));
          entities.push(
            new Decoration(
              cellGrid.levelCoordToWorldCoord(machinePosition),
              waterCooler,
              wallDirection.angle
            )
          );
        }
      }
    }
  }
  return entities;
}

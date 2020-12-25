import Entity from "../../../../core/entity/Entity";
import { V2d } from "../../../../core/Vector";
import Decoration from "../../../environment/Decoration";
import { waterCooler } from "../../../environment/decorations/decorations";
import VendingMachine from "../../../environment/furniture-plus/VendingMachine";
import CellGrid from "../../level-generation/CellGrid";

type NubbyDecorator = (cell: V2d, wallDirection: V2d) => Entity[];
export const NUBBY_DECORATORS: NubbyDecorator[] = [
  (cell, wallDirection) => {
    const machinePosition = cell.sub(wallDirection.mul(0.1));

    return [
      new VendingMachine(
        CellGrid.levelCoordToWorldCoord(machinePosition),
        wallDirection.angle + Math.PI / 2
      ),
    ];
  },
  (cell, wallDirection) => {
    const machinePosition = cell.sub(wallDirection.mul(0.13));
    return [
      new Decoration(
        CellGrid.levelCoordToWorldCoord(machinePosition),
        waterCooler,
        wallDirection.angle
      ),
    ];
  },
];

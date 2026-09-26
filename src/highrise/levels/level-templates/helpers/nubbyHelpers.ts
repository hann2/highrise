import Entity from "../../../../core/entity/Entity";
import { choose, rUniform } from "../../../../core/util/Random";
import { V2d } from "../../../../core/Vector";
import Decoration from "../../../environment/Decoration";
import { waterCooler } from "../../../environment/decorations/decorations";
import VendingMachine, {
  VendingMachineKind,
} from "../../../environment/furniture-plus/VendingMachine";
import { FragGrenade } from "../../../weapons/consumables/consumable-stats/FragGrenade";
import { Molotov } from "../../../weapons/consumables/consumable-stats/Molotov";
import CellGrid from "../../level-generation/CellGrid";

/** Most vending machines on a floor; the other nubbies get water coolers */
export const MACHINES_PER_FLOOR = 2;

/** How likely each kind of machine is, relative to each other */
const MACHINE_KIND_WEIGHTS: Record<VendingMachineKind, number> = {
  snack: 2,
  ammo: 2,
  grenade: 1,
};

/** A vending machine of a random kind against the back wall of a nubby */
export function vendingMachineIn(cell: V2d, wallDirection: V2d): Entity[] {
  const machinePosition = cell.sub(wallDirection.mul(0.1));
  return [
    new VendingMachine(
      CellGrid.levelCoordToWorldCoord(machinePosition),
      wallDirection.angle + Math.PI / 2,
      chooseMachineKind(),
      choose(FragGrenade, Molotov),
    ),
  ];
}

/** A water cooler against the back wall of a nubby */
export function waterCoolerIn(cell: V2d, wallDirection: V2d): Entity[] {
  const coolerPosition = cell.sub(wallDirection.mul(0.13));
  return [
    new Decoration(
      CellGrid.levelCoordToWorldCoord(coolerPosition),
      waterCooler,
      wallDirection.angle,
    ),
  ];
}

function chooseMachineKind(): VendingMachineKind {
  const kinds = Object.keys(MACHINE_KIND_WEIGHTS) as VendingMachineKind[];
  const total = kinds.reduce((sum, k) => sum + MACHINE_KIND_WEIGHTS[k], 0);
  let roll = rUniform(0, total);
  for (const kind of kinds) {
    roll -= MACHINE_KIND_WEIGHTS[kind];
    if (roll < 0) {
      return kind;
    }
  }
  return kinds[kinds.length - 1];
}

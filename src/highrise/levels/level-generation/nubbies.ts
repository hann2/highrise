import Entity from "../../../core/entity/Entity";
import { shuffle } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import { MACHINES_PER_FLOOR } from "../level-templates/helpers/nubbyHelpers";
import LevelTemplate from "../level-templates/LevelTemplate";
import CellGrid from "./CellGrid";

export function fillNubbies(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate,
): Entity[] {
  const nubbies: { cell: V2d; wallDirection: V2d }[] = [];

  for (const cell of cellGrid.getCells()) {
    if (cell.content) {
      continue;
    }

    let openDirection: V2d;
    let found = 0;
    for (const direction of CARDINAL_DIRECTIONS_VALUES) {
      let wall = CellGrid.getWallInDirection(cell.position, direction);
      if (!cellGrid.isExisting(wall)) {
        found += 1;
        openDirection = direction;
      }
    }
    const isANubby = found === 1;
    if (!isANubby) {
      continue;
    }

    cell.content = "nubby";
    nubbies.push({ cell: cell.position, wallDirection: openDirection! });
  }

  // A few of them, anywhere on the floor, get vending machines
  const machines = new Set(
    shuffle([...nubbies.keys()]).slice(0, MACHINES_PER_FLOOR),
  );
  return nubbies.flatMap(({ cell, wallDirection }, i) =>
    levelTemplate.getNubbyDecorations(cell, wallDirection, machines.has(i)),
  );
}

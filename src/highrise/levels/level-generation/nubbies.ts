import Entity from "../../../core/entity/Entity";
import { choose } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import LevelTemplate from "../level-templates/LevelTemplate";
import CellGrid from "./CellGrid";

export function fillNubbies(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate
): Entity[] {
  const entities: Entity[] = [];

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

    if (isANubby) {
      const content = choose("vending", "water-cooler");
      cell.content = content;
      const wallDirection = openDirection!;

      entities.push(
        ...levelTemplate.getNubbyDecorations(cell.position, wallDirection)
      );
    }
  }
  return entities;
}

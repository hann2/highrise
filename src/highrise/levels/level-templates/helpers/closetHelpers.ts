import Entity from "../../../../core/entity/Entity";
import { choose } from "../../../../core/util/Random";
import Decoration from "../../../environment/Decoration";
import {
  bookcase1,
  bookcase2,
  boxPile1,
  boxPile2,
  boxShelf1,
  boxShelf2,
} from "../../../environment/decorations/decorations";
import CellGrid, { Closet } from "../../level-generation/CellGrid";

type ClosetDecorator = (closet: Closet) => Entity[];

export const CLOSET_DECORATORS: Array<ClosetDecorator> = [
  (closet) => [
    new Decoration(
      CellGrid.levelCoordToWorldCoord(
        closet.backCell.add(closet.backWallDirection.mul(-0.2))
      ),
      choose(boxPile1, boxPile2),
      closet.backWallDirection.angle + Math.PI
    ),
  ],
  (closet) => [
    new Decoration(
      CellGrid.levelCoordToWorldCoord(
        closet.backCell.add(
          closet.backWallDirection
            .mul(-0.25)
            .add(
              closet.backWallDirection.rotate90cw().mul(choose(-0.1, 0, 0.1))
            )
        )
      ),
      choose(boxShelf1, boxShelf2),
      closet.backWallDirection.angle + Math.PI
    ),
  ],
  (closet) => [
    new Decoration(
      CellGrid.levelCoordToWorldCoord(
        closet.backCell.add(closet.backWallDirection.mul(-0.22))
      ),
      choose(bookcase1, bookcase2),
      closet.backWallDirection.angle + Math.PI
    ),
  ],
];

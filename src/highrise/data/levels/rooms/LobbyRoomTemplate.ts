import Entity from "../../../../core/entity/Entity";
import { choose } from "../../../../core/util/Random";
import { V } from "../../../../core/Vector";
import Decoration from "../../../entities/Decoration";
import Furniture from "../../../entities/Furniture";
import {
  chairRight,
  chairUp,
  coffeeTable,
  endTable1,
  endTable2,
  lobbyDesk,
  piano,
  rug,
} from "../../../view/DecorationSprite";
import { WallID } from "../levelGeneration";
import {
  AngleTransformer,
  CellTransformer,
  WallTransformer,
} from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

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
    return entities;
  }
}

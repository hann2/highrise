import Entity from "../../../core/entity/Entity";
import { V } from "../../../core/Vector";
import Decoration from "../../entities/Decoration";
import { lobbyDesk } from "../../view/DecorationSprite";
import {
  AngleTransformer,
  CellTransformer,
  WallTransformer,
} from "./ElementTransformer";
import { WallID } from "./levelGeneration";
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
    entities.push(new Decoration(transformCell(V(2.5, 3.5)), lobbyDesk));
    return entities;
  }
}

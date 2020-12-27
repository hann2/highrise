import Entity from "../../../core/entity/Entity";
import { V, V2d } from "../../../core/Vector";
import Spitter from "../../enemies/spitter/Spitter";
import Zombie from "../../enemies/zombie/Zombie";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import { RoomTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "./roomUtils";

const DIMENSIONS = V(2, 2);
const DOORS: WallID[] = [[V(1, -1), false]];

export default class HoldingRoom implements RoomTemplate {
  constructor(public floor: DecorationInfo) {}

  getOccupiedCells(): V2d[] {
    return defaultOccupiedCells(DIMENSIONS, DOORS);
  }

  generateWalls(): WallBuilder[] {
    return defaultWalls(DIMENSIONS, DOORS).map((w) => ({
      ...w,
      chainLink: true,
    }));
  }

  generateDoors(): DoorBuilder[] {
    return defaultDoors(DOORS).map((d) => ({ ...d, chainLink: true }));
  }

  generateEntities({
    roomToWorldPosition,
    roomToWorldDimensions,
  }: RoomTransformer): Entity[] {
    const entities: Entity[] = [];
    const centerWorldCoords = roomToWorldPosition(
      DIMENSIONS.sub(V(1, 1)).mul(0.5)
    );
    const dimensionsWorldCoords = roomToWorldDimensions(DIMENSIONS);
    entities.push(
      new RepeatingFloor(
        this.floor,
        centerWorldCoords.sub(dimensionsWorldCoords.mul(0.5)),
        dimensionsWorldCoords
      )
    );
    entities.push(new Zombie(roomToWorldPosition(V(0, 0))));
    entities.push(new Zombie(roomToWorldPosition(V(1, 0))));
    entities.push(new Zombie(roomToWorldPosition(V(1, 1))));
    entities.push(new Zombie(roomToWorldPosition(V(0, 1))));
    entities.push(new Spitter(roomToWorldPosition(V(0.5, 0.5))));
    entities.push(
      new OverheadLight(
        roomToWorldPosition(V(0.5, 0.5)),
        {
          radius: 5,
          intensity: 0.7,
        },
        false
      )
    );
    return entities;
  }
}

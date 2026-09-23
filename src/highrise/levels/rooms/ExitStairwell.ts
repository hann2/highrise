import Entity from "../../../core/entity/Entity";
import { V, V2d } from "../../../core/Vector";
import { CELL_SIZE } from "../../constants/constants";
import { steelFloor1 } from "../../environment/decorations/decorations";
import Door from "../../environment/Door";
import Exit from "../../environment/Exit";
import FloorText from "../../environment/FloorText";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import Stairwell from "../../environment/Stairwell";
import { Direction } from "../../utils/directions";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import { RoomTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "./roomUtils";

const DIMENSIONS = V(2, 2);
// The only way in, on the bottom of the lower left cell
const DOORS: WallID[] = [[V(0, 1), false]];
// Where the stairs up are, in the corner furthest from the door
const STAIRS_CELL = V(1, 0);

/**
 * The stairwell at the end of a floor: a safe landing with the stairs up,
 * behind a one-way door that locks once the leader is inside.
 */
export default class ExitStairwell implements RoomTemplate {
  private door?: Door;

  getOccupiedCells(): V2d[] {
    return defaultOccupiedCells(DIMENSIONS, DOORS);
  }

  generateWalls(): WallBuilder[] {
    return defaultWalls(DIMENSIONS, DOORS);
  }

  generateDoors(): DoorBuilder[] {
    return defaultDoors(DOORS).map((d) => ({
      ...d,
      // Swings in from the hallway, never back out
      opensToward: Direction.UP,
      locked: true,
      onBuilt: (door: Door) => (this.door = door),
    }));
  }

  generateEntities({
    roomToWorldPosition,
    roomToWorldAngle,
  }: RoomTransformer): Entity[] {
    const entities: Entity[] = [];

    const cornerA = roomToWorldPosition(V(-0.5, -0.5));
    const cornerB = roomToWorldPosition(DIMENSIONS.sub(V(0.5, 0.5)));
    const min = V(
      Math.min(cornerA.x, cornerB.x),
      Math.min(cornerA.y, cornerB.y),
    );
    const max = V(
      Math.max(cornerA.x, cornerB.x),
      Math.max(cornerA.y, cornerB.y),
    );
    entities.push(new Stairwell(min, max, () => this.door));

    entities.push(new RepeatingFloor(steelFloor1, min, max.sub(min)));

    const [stairsX, stairsY] = roomToWorldPosition(STAIRS_CELL);
    const half = CELL_SIZE / 2;
    entities.push(
      new Exit(
        stairsX - half,
        stairsY - half,
        stairsX + half,
        stairsY + half,
        // You walk up the stairs from the cell below them
        roomToWorldAngle(Direction.UP.angle),
      ),
    );

    entities.push(
      new FloorText(roomToWorldPosition(V(0, 0)), "EXIT", {
        heightMeters: 0.6,
        color: "#33dd55",
      }),
    );

    entities.push(
      new OverheadLight(roomToWorldPosition(DIMENSIONS.sub(V(1, 1)).mul(0.5)), {
        radius: 5,
        intensity: 0.6,
        color: 0xbbffcc,
      }),
    );

    return entities;
  }
}

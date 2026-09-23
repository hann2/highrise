import Entity from "../../../core/entity/Entity";
import { degToRad } from "../../../core/util/MathUtil";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CELL_SIZE } from "../../constants/constants";
import Decoration from "../../environment/Decoration";
import {
  bookcase1,
  bookcase2,
  endTable1,
  endTable2,
  fancyChair1,
  fancyCoffeeTable1,
  lobbyDesk,
  piano,
  redCarpetBottom,
  redCarpetCenter,
  redCarpetInnerBottomLeft,
  redCarpetInnerBottomRight,
  redCarpetInnerTopLeft,
  redCarpetInnerTopRight,
  redCarpetLeft,
  redCarpetLowerLeft,
  redCarpetLowerRight,
  redCarpetRight,
  redCarpetTop,
  redCarpetUpperLeft,
  redCarpetUpperRight,
  rug,
  steelFloor1,
} from "../../environment/decorations/decorations";
import { DirectionalSprite } from "../../environment/decorations/DirectionalSprite";
import ElevatorDoor from "../../environment/ElevatorDoor";
import FloorText from "../../environment/FloorText";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import TiledFloor, { Tiles } from "../../environment/TiledFloor";
import { CARDINAL_DIRECTIONS, Direction } from "../../utils/directions";
import CellGrid, {
  DoorBuilder,
  WallBuilder,
  WallID,
} from "../level-generation/CellGrid";
import { wallIDToDoorBuilder } from "../level-generation/doors";
import { RoomTransformer } from "./ElementTransformer";
import {
  doubleResolution,
  fillFloorWithBorders,
  FloorMask,
  insetBorders,
} from "./floorUtils";
import RoomTemplate from "./RoomTemplate";
import { defaultOccupiedCells } from "./roomUtils";

const directionalCarpet: DirectionalSprite = {
  baseSprites: {
    RIGHT: redCarpetRight,
    DOWN: redCarpetBottom,
    LEFT: redCarpetLeft,
    UP: redCarpetTop,
    RIGHTUP: redCarpetUpperRight,
    RIGHTDOWN: redCarpetLowerRight,
    LEFTUP: redCarpetUpperLeft,
    LEFTDOWN: redCarpetLowerLeft,
    CENTER: redCarpetCenter,
  },
  insideCorners: {
    RIGHTUP: redCarpetInnerTopRight,
    RIGHTDOWN: redCarpetInnerBottomRight,
    LEFTUP: redCarpetInnerTopLeft,
    LEFTDOWN: redCarpetInnerBottomLeft,
  },
};

interface Elevator {
  cell: V2d;
  openDirection: keyof typeof Direction;
}

/*
 * The lobby, in cells (the room fills the whole level, so room coordinates are
 * level coordinates):
 *
 *        0  1  2  3  4  5  6  7  8  9
 *     0  E  .  E  E  .  E  [board] |S  <- stairs
 *     1  E  .  E  E  .  E  .  .  D  .     D: the stairwell door
 *     2  E  .  E  A  .  E  .  .  .  .     A: the elevator you arrive in
 *     3  .  . Bob .  .  .  .  .  .  .
 *     4  .  .  desk  .  .  .  .  .  B     B: bookcases (the encyclopedia)
 *     5  chairs  .  piano .  .  .  .
 *     6  chairs  .  .  .  .  .  .  .  .
 */
export const LOBBY_SIZE = V(10, 7);

const ELEVATORS: Elevator[] = [
  { cell: V(0, 0), openDirection: "RIGHT" },
  { cell: V(0, 1), openDirection: "RIGHT" },
  { cell: V(0, 2), openDirection: "RIGHT" },
  { cell: V(2, 0), openDirection: "LEFT" },
  { cell: V(2, 1), openDirection: "LEFT" },
  { cell: V(2, 2), openDirection: "LEFT" },
  { cell: V(3, 0), openDirection: "RIGHT" },
  { cell: V(3, 1), openDirection: "RIGHT" },
  { cell: V(3, 2), openDirection: "RIGHT" },
  { cell: V(5, 0), openDirection: "LEFT" },
  { cell: V(5, 1), openDirection: "LEFT" },
  { cell: V(5, 2), openDirection: "LEFT" },
];

/** The elevator the player arrives in, with its doors shut */
export const ARRIVAL_ELEVATOR = ELEVATORS[8];

/** The stairwell up to the run, in the top right corner */
const STAIRWELL_CELLS = [V(8, 0), V(9, 0), V(8, 1), V(9, 1)];
const STAIRWELL_WALLS: WallID[] = [
  [V(7, 0), true],
  [V(8, 1), false],
  [V(9, 1), false],
];
/** On the left of the stairwell's lower cell */
const STAIRWELL_DOOR: WallID = [V(7, 1), true];
/** Where the stairs up are: stepping on them starts the run */
export const STAIRS_CELL = V(9, 0);

/** Behind the reception desk */
export const RECEPTIONIST_POSITION = V(2.5, 2.98);

/** The bookcases along the right wall, which open the encyclopedia */
export const BOOKCASE_POSITION = V(9.28, 4);

/**
 * Where the other characters wait, roughly best spots first. Clear of the
 * furniture and of the way out of the arrival elevator.
 */
export const CHARACTER_SPOTS: readonly V2d[] = [
  V(5.6, 3.5),
  V(6.5, 4.6),
  V(1.3, 4.3),
  V(7.6, 3.3),
  V(2.1, 5.4),
  V(5.8, 6.1),
  V(7.2, 5.6),
  V(3.1, 5.8),
  V(8.4, 4.8),
  V(8.7, 2.5),
  V(2.3, 6.4),
  V(8.3, 6.2),
];

/**
 * The lobby: a bank of elevators, the reception desk, a sitting area and a
 * piano, and a stairwell up to the rest of the building. Hand built, and the
 * only room on its level (see `generateLobby`).
 */
export default class LobbyRoomTemplate implements RoomTemplate {
  /** The doors of the elevator the player arrives in, once made */
  arrivalDoor?: ElevatorDoor;

  getOccupiedCells(): V2d[] {
    return defaultOccupiedCells(LOBBY_SIZE, []);
  }

  generateWalls(): WallBuilder[] {
    const walls: WallBuilder[] = [];
    const addWall = (id: WallID) =>
      walls.push({ exists: true, destructible: false, id, chainLink: false });

    for (const e of ELEVATORS) {
      for (const direction of CARDINAL_DIRECTIONS) {
        if (direction !== e.openDirection) {
          addWall(CellGrid.getWallInDirection(e.cell, Direction[direction]));
        }
      }
    }
    STAIRWELL_WALLS.forEach(addWall);

    // The outside of the level has its own walls
    return walls.filter((wall) => isInside(wall.id));
  }

  generateDoors(): DoorBuilder[] {
    return [
      {
        ...wallIDToDoorBuilder(STAIRWELL_DOOR),
        // Swings into the stairwell, never back out
        opensToward: Direction.RIGHT,
      },
    ];
  }

  private generateFloorMask(): FloorMask {
    const lowResolutionFloorMask: FloorMask = [];
    for (let i = 0; i < LOBBY_SIZE.x; i++) {
      lowResolutionFloorMask[i] = [];
      for (let j = 0; j < LOBBY_SIZE.y; j++) {
        lowResolutionFloorMask[i][j] = true;
      }
    }
    for (const e of ELEVATORS) {
      lowResolutionFloorMask[e.cell.x][e.cell.y] = false;
    }
    for (const cell of STAIRWELL_CELLS) {
      lowResolutionFloorMask[cell.x][cell.y] = false;
    }
    return doubleResolution(doubleResolution(lowResolutionFloorMask));
  }

  generateEntities({ roomToWorldPosition }: RoomTransformer): Entity[] {
    const entities: Entity[] = [];

    const carpetScale = redCarpetUpperLeft.heightMeters / CELL_SIZE;
    const tileScale = V(carpetScale * CELL_SIZE, carpetScale * CELL_SIZE);
    const mainTiles: Tiles = insetBorders(
      fillFloorWithBorders(this.generateFloorMask(), directionalCarpet),
      directionalCarpet,
    );
    const elevatorTiles = insetBorders(
      fillFloorWithBorders(
        doubleResolution(doubleResolution([[true]])),
        directionalCarpet,
      ),
      directionalCarpet,
    );
    entities.push(
      new TiledFloor(roomToWorldPosition(V(-0.5, -0.5)), tileScale, mainTiles),
    );

    for (const e of ELEVATORS) {
      entities.push(
        new TiledFloor(
          roomToWorldPosition(e.cell.add(V(-0.5, -0.5))),
          tileScale,
          elevatorTiles,
        ),
      );

      const doorDimensionsLevelCoords = V(0.25 / CELL_SIZE, 1);
      const doorUpperLeftCorner = e.cell
        .add(Direction[e.openDirection].mul(0.5))
        .sub(doorDimensionsLevelCoords.mul(0.5));
      // Nobody opens the others: they're just the rest of the bank
      const door = new ElevatorDoor(
        roomToWorldPosition(doorUpperLeftCorner),
        doorDimensionsLevelCoords.mul(CELL_SIZE),
        true,
        false,
      );
      entities.push(door);

      if (e === ARRIVAL_ELEVATOR) {
        this.arrivalDoor = door;
        // Only the one you're in is lit, so it's clear where you are
        entities.push(
          new OverheadLight(roomToWorldPosition(e.cell), {
            radius: 3,
            intensity: 1.2,
            color: 0xffe2b0,
          }),
        );
      }
    }

    // The stairwell
    const stairwellMin = roomToWorldPosition(V(7.5, -0.5));
    entities.push(
      new RepeatingFloor(steelFloor1, stairwellMin, V(2, 2).mul(CELL_SIZE)),
      new OverheadLight(roomToWorldPosition(V(8.5, 0.5)), {
        radius: 5,
        intensity: 0.6,
        color: 0xbbffcc,
      }),
      new FloorText(roomToWorldPosition(V(6.55, 1.25)), "STAIRS →", {
        heightMeters: 0.45,
      }),
    );

    // Reception, the sitting area and the piano
    entities.push(
      new Decoration(roomToWorldPosition(V(2.5, 4.5)), rug, degToRad(90)),
      new Decoration(roomToWorldPosition(V(2.5, 3.5)), lobbyDesk),
      new Decoration(
        roomToWorldPosition(V(-0.15, 5)),
        fancyChair1,
        degToRad(90),
      ),
      new Decoration(
        roomToWorldPosition(V(-0.15, 5.47)),
        fancyChair1,
        degToRad(90),
      ),
      new Decoration(roomToWorldPosition(V(0.35, 6)), fancyChair1),
      new Decoration(roomToWorldPosition(V(0.85, 6)), fancyChair1),
      new Decoration(
        roomToWorldPosition(V(-0.15, 6)),
        choose(endTable1, endTable2),
      ),
      new Decoration(roomToWorldPosition(V(0.6, 5)), fancyCoffeeTable1),
      new Decoration(roomToWorldPosition(V(4.2, 5.15)), piano, degToRad(-35)),
    );

    // The encyclopedia lives in the bookcases
    entities.push(
      new Decoration(
        roomToWorldPosition(BOOKCASE_POSITION.add(V(0, -0.36))),
        bookcase1,
      ),
      new Decoration(
        roomToWorldPosition(BOOKCASE_POSITION.add(V(0.02, 0.33))),
        bookcase2,
      ),
      new FloorText(
        roomToWorldPosition(BOOKCASE_POSITION.add(V(-0.62, 0))),
        "ENCYCLOPEDIA",
        { heightMeters: 0.3, rotation: -Math.PI / 2 },
      ),
    );

    for (const position of [
      V(1, 1),
      V(4, 1),
      V(1, 4),
      V(4, 4),
      V(7, 1.5),
      V(7.5, 4.5),
    ]) {
      entities.push(
        new OverheadLight(roomToWorldPosition(position), { radius: 10 }),
      );
    }

    return entities;
  }
}

/** Whether a wall is between two cells of the lobby, rather than on its edge */
function isInside([[i, j], right]: WallID): boolean {
  return right
    ? i >= 0 && i < LOBBY_SIZE.x - 1 && j >= 0 && j < LOBBY_SIZE.y
    : j >= 0 && j < LOBBY_SIZE.y - 1 && i >= 0 && i < LOBBY_SIZE.x;
}

import { V } from "../../../core/Vector";
import { CELL_SIZE } from "../../constants/constants";
import { cementFloor } from "../../environment/decorations/decorations";
import ElevatorDoor from "../../environment/ElevatorDoor";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import { Level } from "../Level";
import LobbyRoomTemplate, { LOBBY_SIZE } from "../rooms/LobbyRoomTemplate";
import CellGrid from "./CellGrid";
import { buildDoorEntity } from "./doors";
import { addInnerWalls, addOuterWalls } from "./generateWalls";
import { addRoom } from "./roomPlacement";

export interface LobbyLevel extends Level {
  /** The doors of the elevator the player arrives in */
  arrivalDoor: ElevatorDoor;
}

/**
 * Builds the lobby: one hand-built room that fills its level, so there's no
 * maze, no closets and no enemies. Its layout is in `LobbyRoomTemplate`, in
 * level coordinates.
 */
export function generateLobby(): LobbyLevel {
  const [width, height] = LOBBY_SIZE;
  const cellGrid = new CellGrid(width, height);
  const room = new LobbyRoomTemplate();
  const { entities: roomEntities } = addRoom(cellGrid, room, 0, V(0, 0));
  const worldSize = V(width, height).mul(CELL_SIZE);

  return {
    entities: [
      new RepeatingFloor(cementFloor, [0, 0], worldSize),
      new AmbientLight(0x777777),
      ...addOuterWalls([width, height]),
      ...addInnerWalls(cellGrid),
      ...roomEntities,
      ...cellGrid.doors.map((door) => buildDoorEntity(cellGrid, door)),
    ],
    width: worldSize.x,
    height: worldSize.y,
    arrivalDoor: room.arrivalDoor!,
  };
}

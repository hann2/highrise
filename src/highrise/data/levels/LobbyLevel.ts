import { seededShuffle } from "../../../core/util/Random";
import BathroomTemplate from "./BathroomTemplate";
import { POSSIBLE_ORIENTATIONS } from "./levelGeneration";
import LevelTemplate from "./LevelTemplate";
import LobbyRoomTemplate from "./LobbyRoomTemplate";
import RoomTemplate from "./RoomTemplate";
import TransformedRoomTemplate from "./TransformedRoomTemplate";
import ZombieRoomTemplate from "./ZombieRoomTemplate";

export default class LobbyLevel extends LevelTemplate {
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    const shuffledOrientations = seededShuffle(POSSIBLE_ORIENTATIONS, seed);
    rooms.push(new LobbyRoomTemplate());
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[0]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[1]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new ZombieRoomTemplate(),
        shuffledOrientations[2]
      )
    );

    return rooms;
  }
}

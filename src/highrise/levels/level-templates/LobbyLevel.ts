import { seededShuffle } from "../../../core/util/Random";
import { POSSIBLE_ORIENTATIONS } from "../level-generation/levelGeneration";
import LevelTemplate from "./LevelTemplate";
import BathroomTemplate from "../rooms/BathroomTemplate";
import LobbyRoomTemplate from "../rooms/LobbyRoomTemplate";
import RoomTemplate from "../rooms/RoomTemplate";
import TransformedRoomTemplate from "../rooms/TransformedRoomTemplate";
import ZombieRoomTemplate from "../rooms/ZombieRoomTemplate";

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
        new BathroomTemplate(),
        shuffledOrientations[2]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[3]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[4]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[5]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[6]
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

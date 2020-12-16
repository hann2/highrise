import { choose, seededShuffle } from "../../../core/util/Random";
import { POSSIBLE_ORIENTATIONS } from "../level-generation/levelGeneration";
import LevelTemplate from "./LevelTemplate";
import BathroomTemplate, { BATHROOM_STYLES } from "../rooms/BathroomTemplate";
import LobbyRoomTemplate from "../rooms/LobbyRoomTemplate";
import RoomTemplate from "../rooms/RoomTemplate";
import TransformedRoomTemplate from "../rooms/TransformedRoomTemplate";
import ZombieRoomTemplate from "../rooms/ZombieRoomTemplate";
import { makeBathroomPair } from "./levelTemplateHelpers";

export default class LobbyLevel extends LevelTemplate {
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    const shuffledOrientations = seededShuffle(POSSIBLE_ORIENTATIONS, seed);
    rooms.push(new LobbyRoomTemplate());
    rooms.push(...makeBathroomPair(seed));
    rooms.push(
      new TransformedRoomTemplate(
        new ZombieRoomTemplate(),
        shuffledOrientations[2]
      )
    );

    return rooms;
  }
}

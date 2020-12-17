import { seededShuffle } from "../../../core/util/Random";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import LobbyRoomTemplate from "../rooms/LobbyRoomTemplate";
import RoomTemplate from "../rooms/RoomTemplate";
import TransformedRoomTemplate, {
  POSSIBLE_ORIENTATIONS,
} from "../rooms/TransformedRoomTemplate";
import ZombieRoomTemplate from "../rooms/ZombieRoomTemplate";
import LevelTemplate from "./LevelTemplate";
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

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x060606);
  }
}

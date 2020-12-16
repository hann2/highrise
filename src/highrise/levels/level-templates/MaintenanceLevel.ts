import { seededShuffle } from "../../../core/util/Random";
import { POSSIBLE_ORIENTATIONS } from "../level-generation/levelGeneration";
import LevelTemplate from "./LevelTemplate";
import BathroomTemplate from "../rooms/BathroomTemplate";
import NecromancerArena from "../rooms/NecromancerArena";
import RoomTemplate from "../rooms/RoomTemplate";
import TransformedRoomTemplate from "../rooms/TransformedRoomTemplate";
import ZombieRoomTemplate from "../rooms/ZombieRoomTemplate";
import { makeBathroomPair } from "./levelTemplateHelpers";

export default class MaintenanceLevel extends LevelTemplate {
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    const shuffledOrientations = seededShuffle(POSSIBLE_ORIENTATIONS, seed);
    rooms.push(new NecromancerArena());
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

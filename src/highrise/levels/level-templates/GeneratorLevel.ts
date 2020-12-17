import { seededShuffle } from "../../../core/util/Random";
import { cementFloor } from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import NecromancerArena from "../rooms/NecromancerArena";
import RoomTemplate from "../rooms/RoomTemplate";
import TransformedRoomTemplate, {
  POSSIBLE_ORIENTATIONS,
} from "../rooms/TransformedRoomTemplate";
import ZombieRoomTemplate from "../rooms/ZombieRoomTemplate";
import LevelTemplate from "./LevelTemplate";
import { makeBathroomPair } from "./levelTemplateHelpers";

// A level on which there is an electrical generator
export default class GeneratorLevel extends LevelTemplate {
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

  makeSubfloor(size: [number, number]) {
    return new RepeatingFloor(cementFloor, [0, 0], size);
  }
}

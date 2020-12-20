import { choose, rCardinal, seededShuffle } from "../../../core/util/Random";
import {
  woodFloor1,
  woodFloor2,
  woodFloor3,
} from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import BathroomTemplate, { BATHROOM_STYLES } from "../rooms/BathroomTemplate";
import RoomTemplate from "../rooms/RoomTemplate";
import TransformedRoomTemplate, {
  POSSIBLE_ORIENTATIONS,
} from "../rooms/TransformedRoomTemplate";
import LevelTemplate from "./LevelTemplate";

// Level for testing all the bathrooms
export default class BathroomLevel extends LevelTemplate {
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    const shuffledOrientations = seededShuffle(POSSIBLE_ORIENTATIONS, seed);

    for (let i = 0; i < BATHROOM_STYLES.length; i++) {
      rooms.push(
        new TransformedRoomTemplate(
          new BathroomTemplate(BATHROOM_STYLES[i]),
          shuffledOrientations[i % shuffledOrientations.length]
        )
      );
      break;
    }

    return rooms;
  }

  makeSubfloor(size: [number, number]) {
    const decoration = { ...choose(woodFloor1, woodFloor2, woodFloor3) };
    decoration.rotation = rCardinal();
    return new RepeatingFloor(decoration, [0, 0], size);
  }
}

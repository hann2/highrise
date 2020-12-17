import { choose, rCardinal } from "../../../core/util/Random";
import {
  woodFloor1,
  woodFloor2,
  woodFloor3,
} from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import BathroomTemplate, { BATHROOM_STYLES } from "../rooms/BathroomTemplate";
import RoomTemplate from "../rooms/RoomTemplate";
import LevelTemplate from "./LevelTemplate";

// Level for testing all the bathrooms
export default class BathroomLevel extends LevelTemplate {
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    for (const style of BATHROOM_STYLES) {
      rooms.push(new BathroomTemplate(style));
    }

    return rooms;
  }

  makeSubfloor(size: [number, number]) {
    const decoration = { ...choose(woodFloor1, woodFloor2, woodFloor3) };
    decoration.rotation = rCardinal();
    return new RepeatingFloor(decoration, [0, 0], size);
  }
}

import { seededShuffle } from "../../../core/util/Random";
import { cementFloor } from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import NecromancerArena from "../rooms/NecromancerArena";
import RoomTemplate from "../rooms/RoomTemplate";
import TransformedRoomTemplate, {
  POSSIBLE_ORIENTATIONS,
} from "../rooms/TransformedRoomTemplate";
import ZombieRoomTemplate from "../rooms/ZombieRoomTemplate";
import LevelTemplate from "./LevelTemplate";
import { makeBathroomPair } from "./helpers/levelTemplateHelpers";

export default class ChapelLevel extends LevelTemplate {
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    const shuffledOrientations = seededShuffle(POSSIBLE_ORIENTATIONS, seed);
    rooms.push(new NecromancerArena());
    rooms.push(...makeBathroomPair(seed));
    rooms.push(
      new TransformedRoomTemplate(
        new ZombieRoomTemplate(this.levelIndex),
        shuffledOrientations[2]
      )
    );

    return rooms;
  }

  makeSubfloor(size: [number, number]) {
    return new RepeatingFloor(cementFloor, [0, 0], size);
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x222227);
  }
}

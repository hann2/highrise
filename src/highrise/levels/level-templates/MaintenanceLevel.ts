import { rCardinal, seededShuffle } from "../../../core/util/Random";
import { oldPlankFloor1 } from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import { POSSIBLE_ORIENTATIONS } from "../level-generation/levelGeneration";
import NecromancerArena from "../rooms/NecromancerArena";
import RoomTemplate from "../rooms/RoomTemplate";
import TransformedRoomTemplate from "../rooms/TransformedRoomTemplate";
import ZombieRoomTemplate from "../rooms/ZombieRoomTemplate";
import LevelTemplate from "./LevelTemplate";
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

  makeSubfloor(size: [number, number]) {
    const decorationInfo = { ...oldPlankFloor1 };
    decorationInfo.rotation = rCardinal();
    return new RepeatingFloor(oldPlankFloor1, [0, 0], size);
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x000000);
  }
}

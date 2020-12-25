import { choose, seededShuffle, shuffle } from "../../../core/util/Random";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import {
  carpetFloor1,
  carpetFloor2,
  cementFloor,
  steelFloor1,
  steelFloor2,
  steelFloor3,
  steelFloor4,
  steelFloor5,
} from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import LightSwitchRoomTemplate from "../rooms/LightSwitchRoomTemplate";
import NecromancerArena from "../rooms/NecromancerArena";
import RoomTemplate from "../rooms/RoomTemplate";
import TransformedRoomTemplate, {
  POSSIBLE_ORIENTATIONS,
} from "../rooms/TransformedRoomTemplate";
import ZombieRoomTemplate from "../rooms/ZombieRoomTemplate";
import LevelTemplate from "./LevelTemplate";
import { makeBathroomPair } from "./helpers/levelTemplateHelpers";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";

export default class MaintenanceLevel extends LevelTemplate {
  subFloor: DecorationInfo;
  closetFloor: DecorationInfo;
  roomFloor: DecorationInfo;

  constructor(levelIndex: number) {
    super(levelIndex);

    const potentialFloors: DecorationInfo[] = shuffle([
      cementFloor,
      choose(carpetFloor1, carpetFloor2),
      steelFloor1,
      steelFloor2,
      steelFloor3,
      steelFloor4,
      steelFloor5,
    ]);
    this.subFloor = potentialFloors[0];
    this.closetFloor = potentialFloors[1];
    this.roomFloor = potentialFloors[2];
  }

  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    const shuffledOrientations = seededShuffle(POSSIBLE_ORIENTATIONS, seed);
    rooms.push(...makeBathroomPair(seed));
    rooms.push(
      new TransformedRoomTemplate(
        new LightSwitchRoomTemplate(this.roomFloor),
        shuffledOrientations[0]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new LightSwitchRoomTemplate(this.roomFloor),
        shuffledOrientations[1]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new ZombieRoomTemplate(this.levelIndex),
        shuffledOrientations[2]
      )
    );

    return rooms;
  }

  getAmbientLight() {
    return new AmbientLight(0x000000);
  }

  getClosetFloor(): DecorationInfo {
    return this.closetFloor;
  }

  makeSubfloor(size: [number, number]) {
    return new RepeatingFloor(this.subFloor, [0, 0], size);
  }
}

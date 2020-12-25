import { choose, rCardinal, seededShuffle } from "../../../core/util/Random";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import {
  woodFloor1,
  woodFloor2,
  woodFloor3,
} from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import RoomTemplate from "../rooms/RoomTemplate";
import Shop from "../rooms/shops/Shop";
import TransformedRoomTemplate, {
  ROTATED_ORIENTATIONS,
} from "../rooms/TransformedRoomTemplate";
import { makeBathroomPair } from "./helpers/levelTemplateHelpers";
import LevelTemplate from "./LevelTemplate";

export default class ShopLevel extends LevelTemplate {
  subFloorInfo: DecorationInfo;

  constructor(levelIndex: number) {
    super(levelIndex);

    this.subFloorInfo = choose(woodFloor1, woodFloor2, woodFloor3);
  }

  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    const shops: RoomTemplate[] = [];
    const shuffledOrientations = seededShuffle(ROTATED_ORIENTATIONS, seed);

    for (let i = 0; i < 6; i++) {
      shops.push(
        new TransformedRoomTemplate(
          new Shop(this.subFloorInfo),
          shuffledOrientations[i % shuffledOrientations.length]
        )
      );
    }

    const shuffledShops = seededShuffle(shops, seed);
    for (let i = 0; i < 6; i++) {
      rooms.push(shuffledShops[i]);
    }

    rooms.push(...makeBathroomPair(seed));

    return rooms;
  }

  makeSubfloor(size: [number, number]) {
    const decoration = { ...this.subFloorInfo };
    decoration.rotation = rCardinal();
    return new RepeatingFloor(decoration, [0, 0], size);
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x777777);
  }
}

import { Matrix } from "pixi.js";
import { choose, seededShuffle } from "../../../core/util/Random";
import BakeryTemplate from "./BakeryTemplate";
import BathroomTemplate from "./BathroomTemplate";
import { POSSIBLE_ORIENTATIONS } from "./levelGeneration";
import LevelTemplate from "./LevelTemplate";
import RoomTemplate from "./RoomTemplate";
import TransformedRoomTemplate from "./TransformedRoomTemplate";
import ZombieRoomTemplate from "./ZombieRoomTemplate";

export default class ShopLevel extends LevelTemplate {
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    const shuffledOrientations = seededShuffle(POSSIBLE_ORIENTATIONS, seed);
    rooms.push(
      new TransformedRoomTemplate(
        new BakeryTemplate(),
        choose(new Matrix(1, 0, 0, 1), new Matrix(-1, 0, 0, 1))
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[0]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[1]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new ZombieRoomTemplate(),
        shuffledOrientations[2]
      )
    );

    return rooms;
  }
}

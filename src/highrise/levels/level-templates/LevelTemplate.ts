import Entity from "../../../core/entity/Entity";
import { hsvToRgb, rgbToHex } from "../../../core/util/ColorUtils";
import { choose, rUniform } from "../../../core/util/Random";
import {
  carpetFloor1,
  carpetFloor2,
} from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import RoomTemplate from "../rooms/RoomTemplate";

export default class LevelTemplate {
  constructor(public levelIndex: number) {}

  chooseRoomTemplates(seed: number): RoomTemplate[] {
    return [];
  }

  makeSubfloor(size: [number, number]): Entity {
    const color = rgbToHex(hsvToRgb({ h: rUniform(0, 1), s: 0.4, v: 0.8 }));
    const decorationInfo = choose(carpetFloor1, carpetFloor2);
    const floor = new RepeatingFloor(decorationInfo, [0, 0], size);
    floor.sprite.tint = color;
    return floor;
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x060606);
  }
}

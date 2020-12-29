import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { cementFloor } from "../../environment/decorations/decorations";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import CellGrid from "../level-generation/CellGrid";
import RoomTemplate from "../rooms/RoomTemplate";
import TutorialRoomTemplate from "../rooms/TutorialRoom";
import LevelTemplate from "./LevelTemplate";

// Level for testing all the bathrooms
export default class TutorialLevel extends LevelTemplate {
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    rooms.push(new TutorialRoomTemplate());

    return rooms;
  }

  getSize(): [number, number] {
    return [15, 3];
  }

  generateEnemies(): Entity[] {
    return [];
  }

  getPickups() {
    return [];
  }

  makeSubfloor(size: [number, number]) {
    return new RepeatingFloor(cementFloor, [0, 0], size);
  }

  generateHallwayLight(positionLevelCoords: V2d): OverheadLight | undefined {
    const pos = CellGrid.levelCoordToWorldCoord(positionLevelCoords);
    return new OverheadLight(pos, {
      radius: 6,
      intensity: 0.9,
    });
  }

  getAmbientLight() {
    return new AmbientLight(0x000000);
  }
}

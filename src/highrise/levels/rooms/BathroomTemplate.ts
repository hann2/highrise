import Entity from "../../../core/entity/Entity";
import { choose } from "../../../core/util/Random";
import { V } from "../../../core/Vector";
import {
  bathroomTilesFloor1,
  bathroomTilesFloor2,
  bathroomTilesFloor3,
  bathroomTilesFloor4,
  bathroomTilesFloor5,
  sink1,
  tilesFloor1,
  tilesFloor2,
  tilesFloor3,
  tilesFloor4,
  tilesFloor5,
  tilesFloor6,
  tilesFloor7,
  toilet1,
  toilet2,
  toilet3,
  toilet4,
} from "../../environment/decorations/decorations";
import Furniture from "../../environment/Furniture";
import Wall from "../../environment/Wall";
import { PointLight } from "../../lighting-and-vision/PointLight";
import { AngleTransformer, CellTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

const FLOORS = [
  bathroomTilesFloor1,
  bathroomTilesFloor2,
  bathroomTilesFloor3,
  bathroomTilesFloor4,
  bathroomTilesFloor5,
  tilesFloor1,
  tilesFloor2,
  tilesFloor3,
  tilesFloor4,
  tilesFloor5,
  tilesFloor6,
  tilesFloor7,
];

export default class BathroomTemplate extends RoomTemplate {
  constructor() {
    super(V(2, 3), [[V(-1, 0), true]], choose(...FLOORS));
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    const doorOpenDirection = transformAngle(0);

    // This is either a black-seat bathroom or a white-seat bathroom
    const toiletSet = choose([toilet1, toilet2], [toilet3, toilet4]);

    for (const toiletPosition of [
      V(1.21, 0),
      V(1.21, 0.5),
      V(1.21, 1),
      V(1.21, 1.5),
      V(1.21, 2),
    ]) {
      const sprite = choose(...toiletSet);
      const angle = doorOpenDirection + Math.PI / 2;
      const p = transformCell(toiletPosition);
      entities.push(new Furniture(p, sprite, angle));
    }

    for (const sinkPosition of [V(-0.295, 1), V(-0.295, 2)]) {
      const angle = doorOpenDirection - Math.PI / 2;
      const p = transformCell(sinkPosition);
      entities.push(new Furniture(p, sink1, angle));
    }

    const wallColor = choose(0xccaaaa, 0x448844, 0x5599aa);

    for (const wallY of [0.25, 0.75, 1.25, 1.75]) {
      const start = transformCell(V(0.7, wallY));
      const end = transformCell(V(1.5, wallY));

      entities.push(new Wall(start, end, 0.05, wallColor, false));
    }

    entities.push(
      new PointLight({
        radius: 7,
        intensity: 0.8,
        color: 0xfaf0e6,
        shadowsEnabled: true,
        position: transformCell(V(0.5, 1)),
      })
    );

    return entities;
  }
}

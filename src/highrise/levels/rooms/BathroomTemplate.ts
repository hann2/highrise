import Entity from "../../../core/entity/Entity";
import { choose } from "../../../core/util/Random";
import { V } from "../../../core/Vector";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import {
  bathroomTilesFloor1,
  bathroomTilesFloor2,
  bathroomTilesFloor3,
  bathroomTilesFloor4,
  sink1,
  sink2,
  sinkGroup1,
  sinkGroup2,
  sinkGroup3,
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
  toilet5,
} from "../../environment/decorations/decorations";
import Furniture from "../../environment/Furniture";
import Wall from "../../environment/Wall";
import { PointLight } from "../../lighting-and-vision/PointLight";
import { AngleTransformer, CellTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

interface BathroomStyle {
  floor: DecorationInfo;
  sink: DecorationInfo;
  toilets: DecorationInfo[];
  wallColor: number;
  isSinkGroup: boolean;
}

const blackToilets = [toilet1, toilet2];
const whiteToilets = [toilet3, toilet4];
const steelToilets = [toilet5];

const STYLES: BathroomStyle[] = [
  {
    floor: bathroomTilesFloor1,
    sink: sink1,
    isSinkGroup: false,
    wallColor: 0x88aacc,
    toilets: blackToilets,
  },
  {
    floor: bathroomTilesFloor2,
    sink: sinkGroup3,
    isSinkGroup: true,
    wallColor: 0xdd9999,
    toilets: whiteToilets,
  },
  {
    floor: bathroomTilesFloor3,
    sink: sink1,
    isSinkGroup: false,
    wallColor: 0xffffff,
    toilets: blackToilets,
  },
  {
    floor: bathroomTilesFloor4,
    sink: sinkGroup3,
    isSinkGroup: true,
    wallColor: 0x333333,
    toilets: blackToilets,
  },
  {
    floor: tilesFloor1,
    sink: sink1,
    isSinkGroup: false,
    wallColor: 0xccaa66,
    toilets: whiteToilets,
  },
  {
    floor: tilesFloor2,
    sink: sink1,
    isSinkGroup: false,
    wallColor: 0x6699aa,
    toilets: whiteToilets,
  },
  {
    floor: tilesFloor3,
    sink: sinkGroup1,
    isSinkGroup: true,
    wallColor: 0x777777,
    toilets: steelToilets,
  },
  {
    floor: tilesFloor4,
    sink: sinkGroup2,
    isSinkGroup: true,
    wallColor: 0x777777,
    toilets: blackToilets,
  },
  {
    floor: tilesFloor5,
    sink: sinkGroup2,
    isSinkGroup: true,
    wallColor: 0x99bb99,
    toilets: whiteToilets,
  },
  {
    floor: tilesFloor6,
    sink: sinkGroup1,
    isSinkGroup: true,
    wallColor: 0xbbbbbb,
    toilets: blackToilets,
  },
  {
    floor: tilesFloor7,
    sink: sink1,
    isSinkGroup: false,
    wallColor: 0x666666,
    toilets: whiteToilets,
  },
];

export default class BathroomTemplate extends RoomTemplate {
  private style: BathroomStyle;
  constructor() {
    super(V(2, 3), [[V(-1, 0), true]], bathroomTilesFloor1);

    this.style = choose(...STYLES);
    this.floor = this.style.floor;
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    const doorOpenDirection = transformAngle(0);

    const { isSinkGroup, sink, toilets, wallColor } = this.style;

    for (const toiletPosition of [
      V(1.193, 0),
      V(1.193, 0.66),
      V(1.193, 1.33),
      V(1.193, 2),
    ]) {
      const sprite = choose(...toilets);
      const angle = doorOpenDirection + Math.PI / 2;
      const p = transformCell(toiletPosition);
      entities.push(new Furniture(p, sprite, angle));
    }

    for (const wallY of [0.33, 1, 1.66]) {
      const start = transformCell(V(0.7, wallY));
      const end = transformCell(V(1.5, wallY));

      entities.push(new Wall(start, end, 0.05, wallColor, false));
    }

    if (isSinkGroup) {
      const angle = doorOpenDirection - Math.PI / 2;
      const p = transformCell(V(-0.245, 1.55));
      entities.push(new Furniture(p, sink, angle));
    } else {
      for (const sinkPosition of [
        V(-0.295, 0.8),
        V(-0.295, 1.25),
        V(-0.295, 1.7),
        V(-0.295, 2.15),
      ]) {
        const angle = doorOpenDirection - Math.PI / 2;
        const p = transformCell(sinkPosition);
        entities.push(new Furniture(p, sink, angle));
      }
    }

    entities.push(
      new PointLight({
        radius: 7,
        intensity: 0.8,
        color: 0xfafaff,
        shadowsEnabled: true,
        position: transformCell(V(0.35, 1.75)),
      })
    );
    entities.push(
      new PointLight({
        radius: 7,
        intensity: 0.8,
        color: 0xfafaff,
        shadowsEnabled: true,
        position: transformCell(V(0.35, 0.75)),
      })
    );

    return entities;
  }
}

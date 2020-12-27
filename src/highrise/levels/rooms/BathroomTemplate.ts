import Entity from "../../../core/entity/Entity";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Decoration from "../../environment/Decoration";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import {
  graniteFloor1,
  graniteFloor3,
  sink1,
  sinkGroup1,
  sinkGroup2,
  sinkGroup4,
  sinkGroup5,
  sinkGroup6,
  tilesFloor1,
  tilesFloor10,
  tilesFloor2,
  tilesFloor4,
  tilesFloor5,
  tilesFloor6,
  tilesFloor8,
  tilesFloor9,
  toilet1,
  toilet2,
  toilet3,
  toilet4,
  toilet5,
} from "../../environment/decorations/decorations";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import Wall from "../../environment/Wall";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import { RoomTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "./roomUtils";

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

export const BATHROOM_STYLES: BathroomStyle[] = [
  {
    floor: tilesFloor1,
    sink: sink1,
    isSinkGroup: false,
    wallColor: 0xccaa66,
    toilets: whiteToilets,
  },
  {
    floor: tilesFloor2,
    sink: sinkGroup6,
    isSinkGroup: true,
    wallColor: 0x7799a3,
    toilets: whiteToilets,
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
    sink: sinkGroup4,
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
    floor: tilesFloor8,
    sink: sink1,
    isSinkGroup: false,
    wallColor: 0x666666,
    toilets: whiteToilets,
  },
  {
    floor: tilesFloor9,
    sink: sink1,
    isSinkGroup: false,
    wallColor: 0x666666,
    toilets: whiteToilets,
  },
  {
    floor: tilesFloor10,
    sink: sinkGroup4,
    isSinkGroup: true,
    wallColor: 0xbbaa99,
    toilets: whiteToilets,
  },
  {
    floor: graniteFloor1,
    sink: sinkGroup5,
    isSinkGroup: true,
    wallColor: 0x666666,
    toilets: whiteToilets,
  },
  {
    floor: graniteFloor3,
    sink: sink1,
    isSinkGroup: false,
    wallColor: 0x666666,
    toilets: whiteToilets,
  },
];

const DIMENSIONS = V(2, 3);
const DOORS: WallID[] = [[V(-1, 0), true]];

export default class BathroomTemplate implements RoomTemplate {
  constructor(private style: BathroomStyle = choose(...BATHROOM_STYLES)) {}

  getOccupiedCells(): V2d[] {
    return defaultOccupiedCells(DIMENSIONS, DOORS);
  }

  generateWalls(): WallBuilder[] {
    return defaultWalls(DIMENSIONS, DOORS);
  }

  generateDoors(): DoorBuilder[] {
    return defaultDoors(DOORS);
  }

  generateEntities({
    roomToWorldPosition,
    roomToWorldAngle,
    roomToWorldDimensions,
  }: RoomTransformer): Entity[] {
    const entities: Entity[] = [];

    const doorOpenDirection = roomToWorldAngle(0);

    const { isSinkGroup, sink, toilets, wallColor } = this.style;

    for (const toiletPosition of [
      V(1.193, 0),
      V(1.193, 0.66),
      V(1.193, 1.33),
      V(1.193, 2),
    ]) {
      const sprite = choose(...toilets);
      const angle = doorOpenDirection + Math.PI / 2;
      const p = roomToWorldPosition(toiletPosition);
      entities.push(new Decoration(p, sprite, angle));
    }

    for (const wallY of [0.33, 1, 1.66]) {
      const start = roomToWorldPosition(V(0.7, wallY));
      const end = roomToWorldPosition(V(1.5, wallY));

      entities.push(new Wall(start, end, 0.05, wallColor, false));
    }

    if (isSinkGroup) {
      const angle = doorOpenDirection - Math.PI / 2;
      const p = roomToWorldPosition(V(-0.245, 1.55));
      entities.push(new Decoration(p, sink, angle));
    } else {
      for (const sinkPosition of [
        V(-0.295, 0.8),
        V(-0.295, 1.25),
        V(-0.295, 1.7),
        V(-0.295, 2.15),
      ]) {
        const angle = doorOpenDirection - Math.PI / 2;
        const p = roomToWorldPosition(sinkPosition);
        entities.push(new Decoration(p, sink, angle));
      }
    }

    entities.push(
      new OverheadLight(roomToWorldPosition(V(0.35, 1.75)), {
        radius: 7,
        intensity: 0.8,
        color: 0xfafaff,
      })
    );
    entities.push(
      new OverheadLight(roomToWorldPosition(V(0.35, 0.75)), {
        radius: 7,
        intensity: 0.8,
        color: 0xfafaff,
      })
    );
    const centerWorldCoords = roomToWorldPosition(
      DIMENSIONS.sub(V(1, 1)).mul(0.5)
    );
    const dimensionsWorldCoords = roomToWorldDimensions(DIMENSIONS);
    entities.push(
      new RepeatingFloor(
        this.style.floor,
        centerWorldCoords.sub(dimensionsWorldCoords.mul(0.5)),
        dimensionsWorldCoords
      )
    );

    return entities;
  }

  getEnemyPositions({ roomToWorldPosition }: RoomTransformer): V2d[] {
    const positions: V2d[] = [];
    for (let i = 0; i < DIMENSIONS.x; i++) {
      for (let j = 0; j < DIMENSIONS.y; j++) {
        const p = V(i, j);
        positions.push(roomToWorldPosition(p.add(V(0.25, 0.25))));
        positions.push(roomToWorldPosition(p.add(V(-0.25, 0.25))));
        positions.push(roomToWorldPosition(p.add(V(0.25, -0.25))));
        positions.push(roomToWorldPosition(p.add(V(-0.25, -0.25))));
      }
    }
    return positions;
  }
}

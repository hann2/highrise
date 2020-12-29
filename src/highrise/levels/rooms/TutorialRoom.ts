import { BLEND_MODES, Text } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { degToRad } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { CELL_SIZE } from "../../constants/constants";
import Crawler from "../../enemies/crawler/Crawler";
import Door from "../../environment/Door";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import Wall from "../../environment/Wall";
import WeaponPickup from "../../environment/WeaponPickup";
import Gun from "../../weapons/guns/Gun";
import { M1911 } from "../../weapons/guns/gun-stats/M1911";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import { RoomTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "./roomUtils";

const DIMENSIONS = V(10, 3);
const DOORS: WallID[] = [
  [V(-1, 2), true],
  [V(DIMENSIONS[0] - 1, 0), true],
];

export default class TutorialRoomTemplate implements RoomTemplate {
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
    roomToWorldPosition: toWorld,
  }: RoomTransformer): Entity[] {
    const entities: Entity[] = [];

    // Dark room
    entities.push(
      new OverheadLight(toWorld(V(0.5, 1.5)), {
        radius: 4,
        intensity: 0.9,
      }),
      new FloorPaint(
        toWorld(V(0.5, 1.5)),
        (usingGamepad) => `${usingGamepad ? "LB" : "Q"} to throw\nglowstick`
      ),
      new Wall(toWorld(V(1.5, 2.5)), toWorld(V(1.5, 0.5))),
      new Wall(toWorld(V(2.5, -0.5)), toWorld(V(2.5, 1.5))),
      new Door(
        toWorld(V(2.5, 1.5)),
        CELL_SIZE,
        degToRad(90),
        degToRad(-170),
        degToRad(170)
      )
    );

    for (let i = 3; i < DIMENSIONS[0]; i++) {
      entities.push(new OverheadLight(toWorld(V(i + 0.5, 0.5)), {}));
      entities.push(new OverheadLight(toWorld(V(i + 0.5, 1.5)), {}));
    }

    // Push room
    entities.push(
      new Wall(toWorld(V(4.5, 2.5)), toWorld(V(4.5, 0.5))),
      new FloorPaint(
        toWorld(V(3.5, 1.5)),
        (usingGamepad) => `${usingGamepad ? "A" : "Space"} to\npush`
      ),
      new Crawler(toWorld(V(3.5, 0)))
    );

    // Gun room
    entities.push(
      new Wall(toWorld(V(7, 1.75)), toWorld(V(7, -0.5))),
      new FloorPaint(
        toWorld(V(5.75, 0.25)),
        (usingGamepad) => `${usingGamepad ? "X" : "E"} to pick\nup weapon`
      ),
      new WeaponPickup(toWorld(V(5.75, 1)), new Gun(M1911)),
      new FloorPaint(
        toWorld(V(5.75, 1.75)),
        (usingGamepad) => `${usingGamepad ? "RT" : "Click"} to\nshoot`
      )
    );

    // Reload Room
    entities.push(
      new FloorPaint(
        toWorld(V(8.25, 1.75)),
        (usingGamepad) => `${usingGamepad ? "X" : "R"} to\nreload`
      ),
      new Crawler(toWorld(V(8, 0))),
      new Crawler(toWorld(V(8.5, 0))),
      new FloorPaint(
        toWorld(V(8.25, 0.25)),
        () => `Find the stairs\nto advance`
      )
    );

    return entities;
  }

  getEnemyPositions({ roomToWorldPosition }: RoomTransformer): V2d[] {
    return [];
  }
}

export class FloorPaint extends BaseEntity implements Entity {
  sprite: Text & GameSprite;

  constructor(
    [x, y]: [number, number],
    private getText: (usingGamepad: boolean) => string
  ) {
    super();

    this.sprite = new Text("", {
      fontSize: 32,
      fontFamily: "Capture It",
      fill: "red",
      align: "center",
    });
    this.sprite.blendMode = BLEND_MODES.MULTIPLY;
    this.sprite.position.set(x, y);
    this.sprite.scale.set(1 / 64);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.layerName = Layer.FLOOR_DECALS;
  }

  onInputDeviceChange(usingGamepad: boolean) {
    this.sprite.text = this.getText(usingGamepad);
  }
}

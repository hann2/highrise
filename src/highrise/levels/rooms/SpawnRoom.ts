import { Text } from "pixi.js";
import { Layer } from "../../../config/layers";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";
import { fontName } from "../../../core/resources/resourceUtils";
import { V, V2d } from "../../../core/Vector";
import ArrivalRoom from "../../environment/ArrivalRoom";
import { cementFloor } from "../../environment/decorations/decorations";
import DirectoryPlaque from "../../environment/DirectoryPlaque";
import Door from "../../environment/Door";
import HealthPickup from "../../environment/HealthPickup";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import SpawnLocation from "../../environment/SpawnLocation";
import StoreMachine from "../../environment/StoreMachine";
import type { Shelf } from "../../items/shelf";
import { Direction } from "../../utils/directions";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import { RoomTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "./roomUtils";

const DIMENSIONS = V(3, 3);
// The only way out, on the right of the upper right cell
const DOORS: WallID[] = [[V(2, 0), true]];
// Against the bottom wall of the lower right cell, facing into the room
const STORE_POSITION = V(2, 2.05);

/**
 * Where a floor starts. On the floors of a run (not the tutorial) it's an
 * `ArrivalRoom`, whose door swings out and locks once the leader leaves, and
 * from the second floor on it has the store and the directory plaque.
 */
export default class SpawnRoom implements RoomTemplate {
  private door?: Door;

  constructor(
    private levelIndex: number,
    private difficulty: number = levelIndex,
    /** What the store sells, once it's been dealt */
    private getShelf: () => Shelf | undefined = () => undefined,
  ) {}

  /** The tutorial's spawn room is an ordinary room */
  private get isRunFloor(): boolean {
    return this.levelIndex > 0;
  }

  getOccupiedCells(): V2d[] {
    return defaultOccupiedCells(DIMENSIONS, DOORS);
  }

  generateWalls(): WallBuilder[] {
    return defaultWalls(DIMENSIONS, DOORS);
  }

  generateDoors(): DoorBuilder[] {
    if (!this.isRunFloor) {
      return defaultDoors(DOORS);
    }
    return defaultDoors(DOORS).map((d) => ({
      ...d,
      // Swings out into the hallway, never back in
      opensToward: Direction.RIGHT,
      onBuilt: (door: Door) => (this.door = door),
    }));
  }

  generateEntities({
    roomToWorldPosition,
    roomToWorldDimensions,
    roomToWorldAngle,
  }: RoomTransformer): Entity[] {
    const entities: Entity[] = [];

    // The building directory, on the wall: not on the first floor, so the run
    // ahead is a mystery until a floor has been cleared
    if (this.levelIndex > 1) {
      entities.push(
        new DirectoryPlaque(
          roomToWorldPosition(V(0, -0.38)),
          roomToWorldAngle(0),
        ),
      );
    }

    entities.push(
      new OverheadLight(roomToWorldPosition(V(1, 1)), {
        radius: 6,
        intensity: 1.0,
      }),
    );

    entities.push(new SpawnLocation(roomToWorldPosition(V(1, 2))));
    entities.push(new SpawnLocation(roomToWorldPosition(V(0, 1))));
    entities.push(new SpawnLocation(roomToWorldPosition(V(1, 1))));
    entities.push(new SpawnLocation(roomToWorldPosition(V(2, 1))));

    // The store, from the second floor on: the first floor's quarters are
    // spent at the start of the second
    if (this.levelIndex > 1) {
      entities.push(
        new StoreMachine(
          roomToWorldPosition(STORE_POSITION),
          roomToWorldAngle(0),
          this.getShelf,
        ),
      );
    }

    if (this.difficulty > 1) {
      entities.push(new HealthPickup(roomToWorldPosition(V(0.75, 1.25))));
    }

    entities.push(
      new SpawnRoomFloorPaint(roomToWorldPosition(V(1, 1)), this.levelIndex),
    );

    const centerWorldCoords = roomToWorldPosition(
      DIMENSIONS.sub(V(1, 1)).mul(0.5),
    );
    const dimensionsWorldCoords = roomToWorldDimensions(DIMENSIONS);
    const cornerWorldCoords = centerWorldCoords.sub(
      dimensionsWorldCoords.mul(0.5),
    );
    entities.push(
      new RepeatingFloor(cementFloor, cornerWorldCoords, dimensionsWorldCoords),
    );

    if (this.isRunFloor) {
      entities.push(
        new ArrivalRoom(
          cornerWorldCoords,
          cornerWorldCoords.add(dimensionsWorldCoords),
          () => this.door,
        ),
      );
    }

    return entities;
  }
}

// The text on the ground that says what level it is
class SpawnRoomFloorPaint extends BaseEntity implements Entity {
  sprite: Text & GameSprite;

  constructor([x, y]: [number, number], levelIndex: number) {
    super();

    const isTutorial = levelIndex < 1;
    const text = isTutorial ? "WASD = ↑←↓→" : `Level ${levelIndex}`;
    this.sprite = new Text({
      text,
      style: {
        fontSize: isTutorial ? 32 : 64,
        fontFamily: fontName("captureIt"),
        fill: "red",
        align: "center",
      },
    });
    this.sprite.blendMode = "multiply";
    this.sprite.position.set(x, y);
    this.sprite.scale.set(1 / 64);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.layerName = Layer.FLOOR_DECALS;
  }
}

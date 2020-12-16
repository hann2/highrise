import { BLEND_MODES, Text } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { choose } from "../../../core/util/Random";
import { V } from "../../../core/Vector";
import { getCurrentLevelNumber } from "../../controllers/LevelController";
import SpawnLocation from "../../environment/SpawnLocation";
import WeaponPickup from "../../environment/WeaponPickup";
import { Layer } from "../../config/layers";
import { PointLight } from "../../lighting-and-vision/PointLight";
import { cementFloor } from "../../environment/decorations/decorations";
import Gun from "../../weapons/Gun";
import { GUNS } from "../../weapons/guns/guns";
import { AK47 } from "../../weapons/guns/AK-47";
import { AR15 } from "../../weapons/guns/AR-15";
import { DesertEagle } from "../../weapons/guns/DesertEagle";
import { DoubleBarrelShotgun } from "../../weapons/guns/DoubleBarrelShotgun";
import { Magnum } from "../../weapons/guns/Magnum";
import { P90 } from "../../weapons/guns/P90";
import { PumpShotgun } from "../../weapons/guns/PumpShotgun";
import { MELEE_WEAPONS } from "../../weapons/melee-weapons/meleeWeapons";
import MeleeWeapon from "../../weapons/MeleeWeapon";
import { AngleTransformer, CellTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

export default class SpawnRoom extends RoomTemplate {
  constructor() {
    super(V(3, 3), [[V(2, 0), true]], cementFloor);
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    entities.push(
      new PointLight({
        radius: 6,
        intensity: 1.0,
        shadowsEnabled: true,
        position: transformCell(V(1, 1)),
      })
    );

    entities.push(new SpawnLocation(transformCell(V(1, 2))));
    entities.push(new SpawnLocation(transformCell(V(0, 1))));
    entities.push(new SpawnLocation(transformCell(V(1, 1))));
    entities.push(new SpawnLocation(transformCell(V(2, 1))));

    const gun = new Gun(choose(...GUNS));

    const meleeWeapon = new MeleeWeapon(choose(...MELEE_WEAPONS));
    entities.push(new WeaponPickup(transformCell(V(2, 0)), meleeWeapon));

    entities.push(new WeaponPickup(transformCell(V(0, 0)), new Gun(AK47)));
    entities.push(new WeaponPickup(transformCell(V(0, 1)), new Gun(P90)));
    entities.push(
      new WeaponPickup(transformCell(V(0, 2)), new Gun(PumpShotgun))
    );

    entities.push(new WeaponPickup(transformCell(V(1, 0)), new Gun(AR15)));
    entities.push(new WeaponPickup(transformCell(V(1, 1)), new Gun(Magnum)));
    entities.push(
      new WeaponPickup(transformCell(V(1, 2)), new Gun(DoubleBarrelShotgun))
    );

    entities.push(new SpawnRoomFloor(transformCell(V(1, 1))));

    return entities;
  }
}

class SpawnRoomFloor extends BaseEntity implements Entity {
  sprite: Text & GameSprite;

  constructor([x, y]: [number, number]) {
    super();

    this.sprite = new Text(``, {
      fontSize: 64,
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

  onAdd(game: Game) {
    const level = getCurrentLevelNumber(game);
    this.sprite.text = `Level ${level}`;
  }
}

import { BLEND_MODES, Text } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { choose } from "../../../core/util/Random";
import { V } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { getCurrentLevelNumber } from "../../controllers/LevelController";
import { cementFloor } from "../../environment/decorations/decorations";
import SpawnLocation from "../../environment/SpawnLocation";
import WeaponPickup from "../../environment/WeaponPickup";
import { PointLight } from "../../lighting-and-vision/PointLight";
import Gun from "../../weapons/guns/Gun";
import { AK47 } from "../../weapons/guns/gun-stats/AK-47";
import { AR15 } from "../../weapons/guns/gun-stats/AR-15";
import { DoubleBarrelShotgun } from "../../weapons/guns/gun-stats/DoubleBarrelShotgun";
import { FiveSeven } from "../../weapons/guns/gun-stats/FiveSeven";
import { Glock } from "../../weapons/guns/gun-stats/Glock";
import { GUNS } from "../../weapons/guns/gun-stats/gunStats";
import { Magnum } from "../../weapons/guns/gun-stats/Magnum";
import { P90 } from "../../weapons/guns/gun-stats/P90";
import { PumpShotgun } from "../../weapons/guns/gun-stats/PumpShotgun";
import { MELEE_WEAPONS } from "../../weapons/melee/melee-weapons/meleeWeapons";
import MeleeWeapon from "../../weapons/melee/MeleeWeapon";
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

    const meleeWeapon = new MeleeWeapon(choose(...MELEE_WEAPONS));
    entities.push(new WeaponPickup(transformCell(V(2, 0)), meleeWeapon));

    entities.push(new WeaponPickup(transformCell(V(0, 0)), new Gun(AK47)));
    entities.push(new WeaponPickup(transformCell(V(0, 1)), new Gun(P90)));
    entities.push(
      new WeaponPickup(transformCell(V(0, 2)), new Gun(PumpShotgun))
    );

    entities.push(new WeaponPickup(transformCell(V(2, 1)), new Gun(Glock)));
    entities.push(new WeaponPickup(transformCell(V(2, 2)), new Gun(FiveSeven)));

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

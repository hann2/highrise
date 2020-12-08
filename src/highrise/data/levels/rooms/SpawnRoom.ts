import { BLEND_MODES, Text } from "pixi.js";
import BaseEntity from "../../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../../core/entity/Entity";
import Game from "../../../../core/Game";
import { choose } from "../../../../core/util/Random";
import { V } from "../../../../core/Vector";
import LevelController from "../../../entities/controllers/LevelController";
import SpawnLocation from "../../../entities/SpawnLocation";
import WeaponPickup from "../../../entities/WeaponPickup";
import { Layers } from "../../../layers";
import { PointLight } from "../../../lighting/PointLight";
import { bathroomTiles } from "../../../view/DecorationSprite";
import Gun from "../../../weapons/Gun";
import { GUNS } from "../../../weapons/guns";
import { MELEE_WEAPONS } from "../../../weapons/melee-weapons";
import MeleeWeapon from "../../../weapons/MeleeWeapon";
import { AngleTransformer, CellTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

export default class SpawnRoom extends RoomTemplate {
  constructor() {
    super(V(3, 3), [[V(2, 0), true]], bathroomTiles);
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    const light = new PointLight(6, 0.8);
    light.setPosition(transformCell(V(1, 1)));
    entities.push(light);

    entities.push(new SpawnLocation(transformCell(V(1, 2))));
    entities.push(new SpawnLocation(transformCell(V(0, 1))));
    entities.push(new SpawnLocation(transformCell(V(1, 1))));
    entities.push(new SpawnLocation(transformCell(V(2, 1))));

    const gun = new Gun(choose(...GUNS));
    entities.push(new WeaponPickup(transformCell(V(0, 0)), gun));

    const meleeWeapon = new MeleeWeapon(choose(...MELEE_WEAPONS));
    entities.push(new WeaponPickup(transformCell(V(1.0, 0)), meleeWeapon));

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
    this.sprite.layerName = Layers.WORLD_BACK;
  }

  onAdd(game: Game) {
    // TODO: This is kinda hacky, but it works for now
    const level = (game.entities.getById("level_controller") as LevelController)
      .currentLevel;
    this.sprite.text = `Level ${level}`;
  }
}

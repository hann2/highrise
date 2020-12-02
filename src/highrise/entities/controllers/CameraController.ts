import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { Camera2d } from "../../../core/graphics/Camera2d";
import Human from "../Human";
import LevelController from "./LevelController";
import PositionalSoundListener from "../../../core/sound/PositionalSoundListener";

export default class CameraController extends BaseEntity implements Entity {
  persistent = true;

  constructor(private camera: Camera2d) {
    super();
  }

  onRender() {
    this.camera.z = 50;
    const player = this.getPlayer();
    if (player) {
      this.camera.smoothCenter(player.getPosition());
    }

    this.getListener().setPosition(this.camera.position);
  }

  getListener(): PositionalSoundListener {
    return this.game!.entities.byId(
      "positional_sound_listener"
    ) as PositionalSoundListener;
  }

  getPlayer() {
    const levelController = this.game!.entities.byId(
      "level_controller"
    ) as LevelController;
    return levelController.playerHuman;
  }
}

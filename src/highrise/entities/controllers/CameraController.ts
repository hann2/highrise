import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { Camera2d } from "../../../core/graphics/Camera2d";
import PositionalSoundListener from "../../../core/sound/PositionalSoundListener";
import { V } from "../../../core/Vector";
import LevelController from "./LevelController";

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
    } else {
      this.camera.smoothSetVelocity(V(0, 0));
    }

    this.getListener().setPosition(this.camera.position);
  }

  getListener(): PositionalSoundListener {
    return this.game!.entities.getById(
      "positional_sound_listener"
    ) as PositionalSoundListener;
  }

  getPlayer() {
    const levelController = this.game!.entities.getById(
      "level_controller"
    ) as LevelController;
    return levelController.playerHuman;
  }
}

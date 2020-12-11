import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { Camera2d } from "../../../core/graphics/Camera2d";
import PositionalSoundListener from "../../../core/sound/PositionalSoundListener";
import { V } from "../../../core/Vector";
import PartyManager from "../PartyManager";
import LevelController from "./LevelController";

export default class CameraController extends BaseEntity implements Entity {
  persistent = true;

  constructor(private camera: Camera2d) {
    super();
  }

  onAdd() {
    this.camera.z = 50;
  }

  // TODO: Camera Shake!

  onRender() {
    const player = this.getPlayer();
    if (player) {
      this.camera.smoothCenter(player.getPosition(), undefined);
    } else {
      this.camera.smoothSetVelocity(V(0, 0));
    }

    this.getListener().setPosition(this.camera.position);

    if (this.game?.io.keyIsDown("Equal")) {
      this.camera.z *= 1.01;
    }
    if (this.game?.io.keyIsDown("Minus")) {
      this.camera.z *= 0.99;
    }
  }

  getListener(): PositionalSoundListener {
    return this.game!.entities.getById(
      "positional_sound_listener"
    ) as PositionalSoundListener;
  }

  getPlayer() {
    return (this.game!.entities.getById("party_manager") as PartyManager)
      ?.leader;
  }
}

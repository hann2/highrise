import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { Camera2d } from "../../core/graphics/Camera2d";
import PositionalSoundListener from "../../core/sound/PositionalSoundListener";
import { V } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";

/** How quickly the camera catches up to the player, per second */
const FOLLOW_STIFFNESS = 10;

export default class CameraController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  tickLayer = "camera" as const;
  private shouldCut = true;

  constructor(
    private camera: Camera2d,
    private getPlayer: () => Human | undefined,
  ) {
    super();
  }

  @on("add")
  onAdd() {
    this.camera.z = 75;
  }

  /** Cut straight to the player instead of panning across the new level */
  @on("startLevel")
  onStartLevel() {
    this.shouldCut = true;
  }

  @on("tick")
  onTick() {
    const player = this.getPlayer();
    if (player && this.shouldCut) {
      // The party may not have been placed yet when startLevel is dispatched
      this.shouldCut = false;
      this.camera.center(player.getPosition());
      this.camera.velocity.set(0, 0);
    } else if (player) {
      this.camera.smoothCenter(
        player.getPosition(),
        V(player.body.velocity),
        FOLLOW_STIFFNESS,
      );
    } else {
      this.camera.smoothSetVelocity(V(0, 0));
    }
  }

  @on("render")
  onRender() {
    this.getListener().setPosition(this.camera.position);

    if (this.game.io.isKeyDown("Equal")) {
      this.camera.z *= 1.01;
    }
    if (this.game.io.isKeyDown("Minus")) {
      this.camera.z *= 0.99;
    }
  }

  getListener(): PositionalSoundListener {
    return this.game.entities.getSingleton(PositionalSoundListener);
  }

  @on("inputDeviceChange")
  onInputDeviceChange({ usingGamepad }: { usingGamepad: boolean }) {
    if (usingGamepad) {
      this.game.renderer.hideCursor();
    } else {
      this.game.renderer.setCursor("crosshair");
    }
  }
}

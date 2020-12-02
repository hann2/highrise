import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { ControllerAxis, ControllerButton } from "../../../core/io/Gamepad";
import { KeyCode } from "../../../core/io/Keys";
import { V } from "../../../core/Vector";
import Gun, { FireMode } from "../guns/Gun";
import Human from "../Human";

// Maps keyboard/mouse/gamepad input to human actions
export default class PlayerHumanController
  extends BaseEntity
  implements Entity {
  /** The human being controlled by the player */
  human: Human;

  constructor(human: Human) {
    super();
    this.human = human;
  }

  onMouseDown() {
    this.human.useWeapon();
  }

  onButtonDown(button: ControllerButton) {
    switch (button) {
      case ControllerButton.RT:
        this.human.useWeapon();
        break;
      case ControllerButton.X:
        this.human.interactWithNearest();
        break;
    }
  }

  onKeyDown(key: KeyCode) {
    switch (key) {
      case "KeyE":
        // Interacting
        this.human.interactWithNearest();
        break;
    }
  }

  onTick() {
    const io = this.game!.io;

    this.game!.slowMo = io.keyIsDown("ShiftLeft") ? 0.4 : 1.0;

    // Shooting
    if (
      (io.lmb || this.game?.io.getButton(ControllerButton.RT)) &&
      this.human.weapon instanceof Gun &&
      this.human.weapon?.stats.fireMode === FireMode.FULL_AUTO
    ) {
      this.human.useWeapon();
    }

    // Direction
    if (io.usingGamepad) {
      const direction = V(
        io.getAxis(ControllerAxis.RIGHT_X),
        io.getAxis(ControllerAxis.RIGHT_Y)
      );
      this.human.setDirection(direction.angle);
    } else {
      const mousePosition = this.game!.camera.toWorld(io.mousePosition);
      const mouseDirection = mousePosition.sub(this.human.getPosition()).angle;
      this.human.setDirection(mouseDirection);
    }

    // Moving
    const direction = V(0, 0);
    if (this.game?.io.keyIsDown("KeyW")) {
      direction[1] += -1;
    }
    if (this.game?.io.keyIsDown("KeyS")) {
      direction[1] += 1;
    }
    if (this.game?.io.keyIsDown("KeyA")) {
      direction[0] += -1;
    }
    if (this.game?.io.keyIsDown("KeyD")) {
      direction[0] += 1;
    }

    direction[0] += io.getAxis(ControllerAxis.LEFT_X);
    direction[1] += io.getAxis(ControllerAxis.LEFT_Y);

    if (direction.magnitude > 1) {
      direction.magnitude = 1;
    }

    this.human.walk(direction);
  }
}

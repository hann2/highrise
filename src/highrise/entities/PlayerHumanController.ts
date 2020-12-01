import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V } from "../../core/Vector";
import Human from "./Human";
import { FireMode } from "./guns/Gun";
import { ControllerButton, ControllerAxis } from "../../core/io/Gamepad";

// Maps keyboard/mouse/gamepad input to human actions
export default class PlayerHumanController
  extends BaseEntity
  implements Entity {
  human: Human;

  constructor(human: Human) {
    super();
    this.human = human;
  }

  onMouseDown() {
    this.human.pullTrigger();
  }

  onButtonDown(button: ControllerButton) {
    switch (button) {
      case ControllerButton.RT:
        this.human.pullTrigger();
        break;
    }
  }

  onTick() {
    const io = this.game!.io;
    // Shooting
    if (
      (io.lmb || this.game?.io.getButton(ControllerButton.RT)) &&
      this.human.gun?.stats.fireMode === FireMode.FULL_AUTO
    ) {
      this.human.pullTrigger();
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

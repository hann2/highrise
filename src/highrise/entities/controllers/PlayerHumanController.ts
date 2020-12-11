import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { ControllerAxis, ControllerButton } from "../../../core/io/Gamepad";
import { KeyCode } from "../../../core/io/Keys";
import { choose } from "../../../core/util/Random";
import { V } from "../../../core/Vector";
import Gun from "../../weapons/Gun";
import { GUNS } from "../../weapons/guns";
import { FireMode } from "../../weapons/GunStats";
import Human from "../human/Human";

// Maps keyboard/mouse/gamepad input to human actions
export default class PlayerHumanController
  extends BaseEntity
  implements Entity {
  /** The human being controlled by the player */

  constructor(private getHuman: () => Human) {
    super();
  }

  get human() {
    return this.getHuman();
  }

  onMouseDown() {
    this.human.useWeapon();
  }

  onButtonDown(button: ControllerButton) {
    switch (button) {
      case ControllerButton.RT:
        this.human.useWeapon();
        break;
      case ControllerButton.Y:
        this.human.interactWithNearest();
        break;
      case ControllerButton.X:
        this.human.reload();
        break;
      case ControllerButton.BACK:
        this.human.giveWeapon(new Gun(choose(...GUNS)));
        break;
    }
  }

  onKeyDown(key: KeyCode) {
    switch (key) {
      case "KeyE":
        // Interacting
        this.human.interactWithNearest();
        break;
      case "KeyR":
        // Interacting
        this.human.reload();
        break;
    }
  }

  onTick() {
    if (this.human.isDestroyed) {
      this.destroy();
      return;
    }

    const io = this.game!.io;

    this.game!.slowMo = io.keyIsDown("ShiftLeft") ? 0.2 : 1.0;

    // Shooting
    if (
      (io.lmb || this.game?.io.getButton(ControllerButton.RT)) &&
      this.human.weapon instanceof Gun &&
      this.human.weapon.stats.fireMode === FireMode.FULL_AUTO &&
      this.human.weapon.ammo > 0
    ) {
      this.human.useWeapon();
    }

    // Direction
    if (io.usingGamepad) {
      const direction = V(
        io.getAxis(ControllerAxis.RIGHT_X),
        io.getAxis(ControllerAxis.RIGHT_Y)
      );
      if (direction.magnitude > 0.1) {
        // account for dead zone
        this.human.setDirection(direction.angle);
      }
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

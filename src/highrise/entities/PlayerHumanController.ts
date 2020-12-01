import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V } from "../../core/Vector";
import Human from "./Human";
import { FireMode } from "./guns/Gun";
import { ControllerButton, ControllerAxis } from "../../core/io/Gamepad";
import Interactable, { isInteractable } from "./Interactable";
import { testLineOfSight } from "../utils/visionUtils";
import { KeyCode } from "../../core/io/Keys";
import { choose } from "../../core/util/Random";
import AIHumanController from "./AIHumanController";
import CameraController from "./CameraController";
import Pistol from "./guns/Pistol";
import Rifle from "./guns/Rifle";
import Shotgun from "./guns/Shotgun";
import Party from "./Party";
import { goToLevel, newGame } from "../data/levels/switchLevel";

const INTERACT_DISTANCE = 5;

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

  onKeyDown(key: KeyCode) {
    switch (key) {
      case "KeyE":
        // Interacting
        const interactables = Array.from(this.game!.entities.all)
          .filter(isInteractable)
          .filter((i) => testLineOfSight((i as any) as BaseEntity, this.human))
          .filter(
            (i) =>
              ((i as any) as BaseEntity)
                .getPosition()
                .sub(this.human.getPosition()).magnitude < INTERACT_DISTANCE
          )
          .sort(
            (i1, i2) =>
              ((i1 as any) as BaseEntity)
                .getPosition()
                .sub(this.human.getPosition()).magnitude -
              ((i2 as any) as BaseEntity)
                .getPosition()
                .sub(this.human.getPosition()).magnitude
          ) as Interactable[];
        for (const interactable of interactables) {
          if (interactable.interact(this.human)) {
            break;
          }
        }
        break;
    }
  }

  onTick() {
    const io = this.game!.io;

    this.game!.slowMo = io.keyIsDown("ShiftLeft") ? 0.4 : 1.0;

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

    // Death
    if (this.human.hp <= 0) {
      newGame(this.game!);
    }
  }
}

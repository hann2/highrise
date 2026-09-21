import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { V } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import Gun from "../weapons/guns/Gun";
import { FireMode } from "../weapons/guns/GunStats";
import Human from "./Human";

// Maps keyboard/mouse/gamepad input to human actions
export default class PlayerHumanController
  extends BaseEntity
  implements Entity
{
  persistenceLevel = Persistence.Game;

  constructor(private getPlayer: () => Human) {
    super();
  }

  /** The human being controlled by the player */
  get human() {
    return this.getPlayer();
  }

  onMouseDown() {
    this.human.useWeapon();
  }

  onButtonDown({ button }: { button: ControllerButton }) {
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
      case ControllerButton.LB:
        this.human.throwGlowstick();
        break;
      case ControllerButton.A:
        this.human.push();
        break;
    }
  }

  onKeyDown({ key }: { key: KeyCode }) {
    switch (key) {
      case "KeyE":
        this.human.interactWithNearest();
        break;
      case "KeyR":
        this.human.reload();
        break;
      case "KeyQ":
        this.human.throwGlowstick();
        break;
      case "Space":
        this.human.push();
        break;
    }
  }

  onTick(dt: number) {
    if (this.human.isDestroyed) {
      this.destroy();
      return;
    }

    const io = this.game!.io;

    // Shooting
    if (
      (io.lmb || io.getButton(ControllerButton.RT)) &&
      this.human.weapon instanceof Gun &&
      this.human.weapon.stats.fireMode === FireMode.FULL_AUTO &&
      this.human.weapon.ammo > 0
    ) {
      this.human.useWeapon();
    }

    // Direction
    if (io.usingGamepad) {
      const direction = io.getStick("right");
      if (direction.magnitude > 0.1) {
        // account for dead zone
        this.human.setDirection(direction.angle, dt);
      }
    } else {
      const mousePosition = this.game!.camera.toWorld(io.mousePosition);
      const mouseDirection = mousePosition.sub(this.human.getPosition()).angle;
      this.human.setDirection(mouseDirection, dt);
    }

    // Moving
    const direction = V(0, 0);
    if (io.isKeyDown("KeyW")) {
      direction.y -= 1;
    }
    if (io.isKeyDown("KeyS")) {
      direction.y += 1;
    }
    if (io.isKeyDown("KeyA")) {
      direction.x -= 1;
    }
    if (io.isKeyDown("KeyD")) {
      direction.x += 1;
    }

    direction.iadd(io.getStick("left")).ilimit(1);

    this.human.walkSpring.walkTowards(direction.angle, direction.magnitude);
  }
}

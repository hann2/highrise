import { IoEventDispatch } from "../entity/IoEvents";
import { clamp, clampUp } from "../util/MathUtil";
import { V, V2d } from "../Vector";
import { ControllerAxis, ControllerButton } from "./Gamepad";
import { KeyCode } from "./Keys";
import { MouseButtons } from "./MouseButtons";

const GAMEPAD_POLLING_FREQUENCY = 250; // Hz

const GAMEPAD_MINIMUM = 0.2;
const GAMEPAD_MAXIMUM = 0.95;

// Manages IO
export class IOManager {
  private keys: Map<KeyCode, boolean> = new Map();
  // buttons pressed last frame. Used for checking differences in state.
  private lastButtons: boolean[] = [];
  mouseButtons = [false, false, false, false, false, false];
  mousePosition: V2d = V(0, 0);
  usingGamepad: boolean = false; // True if the gamepad is the main input device
  view: HTMLElement;

  constructor(
    view: HTMLElement,
    private dispatch: IoEventDispatch,
  ) {
    this.view = view;

    this.view.onclick = (e) => this.onClick(e);
    this.view.onmousedown = (e) => this.onMouseDown(e);
    this.view.onmouseup = (e) => this.onMouseUp(e);
    this.view.onmousemove = (e) => this.onMouseMove(e);
    this.view.oncontextmenu = (e) => {
      e.preventDefault();
      this.onClick(e);
      return false;
    };

    document.onkeydown = (e) => {
      this.onKeyDown(e);
    };
    document.onkeyup = (e) => this.onKeyUp(e);

    document.onvisibilitychange = (event) => {
      for (const keyCode of this.keys.keys()) {
        this.keys.set(keyCode, false);
        this.dispatch("keyUp", { key: keyCode });
      }
    };

    // Because this is a polling not pushing interface
    window.setInterval(
      () => this.handleGamepads(),
      1000 / GAMEPAD_POLLING_FREQUENCY,
    );
  }

  // True if the left mouse button is down.
  get lmb(): boolean {
    return this.mouseButtons[MouseButtons.LEFT];
  }

  // True if the middle mouse button is down.
  get mmb(): boolean {
    return this.mouseButtons[MouseButtons.MIDDLE];
  }

  // True if the right mouse button is down.
  get rmb(): boolean {
    return this.mouseButtons[MouseButtons.RIGHT];
  }

  // True if the given key is currently pressed down
  isKeyDown(key: KeyCode): boolean {
    return Boolean(this.keys.get(key));
  }

  // Fire events for gamepad button presses.
  handleGamepads(): void {
    const gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      const buttons = gamepad.buttons.map((button) => button.pressed);

      for (const [button, isDown] of buttons.entries()) {
        if (isDown && !this.lastButtons[button]) {
          this.setUsingGamepad(true);
          this.dispatch("buttonDown", { button });
        } else if (!isDown && this.lastButtons[button]) {
          this.dispatch("buttonUp", { button });
        }
      }
      this.lastButtons = buttons;
    } else {
      this.lastButtons = [];
    }
  }

  private setUsingGamepad(value: boolean) {
    if (this.usingGamepad != value) {
      this.usingGamepad = value;
      this.dispatch("inputDeviceChange", { usingGamepad: this.usingGamepad });
    }
  }

  // Update the position of the mouse.
  onMouseMove(event: MouseEvent) {
    this.setUsingGamepad(false);
    this.mousePosition = V(event.clientX, event.clientY);
  }

  // Fire all click handlers.
  onClick(event: MouseEvent) {
    this.setUsingGamepad(false);
    this.mousePosition = V(event.clientX, event.clientY);
    switch (event.button) {
      case MouseButtons.LEFT:
        this.dispatch("click", undefined);
        break;
      case MouseButtons.RIGHT:
        this.dispatch("rightClick", undefined);
        break;
    }
  }

  // Fire all mouse down handlers.
  onMouseDown(event: MouseEvent) {
    this.setUsingGamepad(false);
    this.mousePosition = V(event.clientX, event.clientY);
    this.mouseButtons[event.button] = true;
    switch (event.button) {
      case MouseButtons.LEFT:
        this.dispatch("mouseDown", undefined);
        break;
      case MouseButtons.RIGHT:
        this.dispatch("rightDown", undefined);
        break;
    }
  }

  // Fire all mouse up handlers
  onMouseUp(event: MouseEvent) {
    this.setUsingGamepad(false);
    this.mousePosition = V(event.clientX, event.clientY);
    this.mouseButtons[event.button] = false;
    switch (event.button) {
      case MouseButtons.LEFT:
        this.dispatch("mouseUp", undefined);
        break;
      case MouseButtons.RIGHT:
        this.dispatch("rightUp", undefined);
        break;
    }
  }

  // Determine whether or not to prevent the default action of a key press.
  shouldPreventDefault(event: KeyboardEvent): boolean {
    if (event.key === "Tab") {
      return true;
    }
    if (event.key.toLowerCase() === "s") {
      // s for save
      return true;
    }
    return false;
  }

  // Fire all key down handlers.
  onKeyDown(event: KeyboardEvent) {
    const code = event.code as KeyCode;
    const wasPressed = this.keys.get(code); // for filtering out auto-repeat stuff
    this.keys.set(code, true);
    if (!wasPressed) {
      this.dispatch("keyDown", { key: code, event });
    }
    if (this.shouldPreventDefault(event)) {
      event.preventDefault();
      return false;
    }
  }

  // Fire all key up handlers.
  onKeyUp(event: KeyboardEvent) {
    const code = event.code as KeyCode;
    this.keys.set(code, false);
    this.dispatch("keyUp", { key: code, event });
    if (this.shouldPreventDefault(event)) {
      event.preventDefault();
      return false;
    }
  }

  /**
   * Gets the current value of a gamepad axis (stick position).
   * @returns Axis value normalized to range [-1, 1], or 0 if no gamepad connected
   */
  getAxis(axis: ControllerAxis): number {
    switch (axis) {
      case ControllerAxis.LEFT_X:
        return this.getStick("left").x;
      case ControllerAxis.LEFT_Y:
        return this.getStick("left").y;
      case ControllerAxis.RIGHT_X:
        return this.getStick("right").x;
      case ControllerAxis.RIGHT_Y:
        return this.getStick("right").y;
      default:
        throw new Error("unknown axis");
    }
  }

  getStick(stick: "left" | "right") {
    const axes = V(0, 0);
    const gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      if (stick === "left") {
        axes.x = gamepad.axes[ControllerAxis.LEFT_X];
        axes.y = gamepad.axes[ControllerAxis.LEFT_Y];
      } else {
        axes.x = gamepad.axes[ControllerAxis.RIGHT_X];
        axes.y = gamepad.axes[ControllerAxis.RIGHT_Y];
      }
      const gamepadRange = GAMEPAD_MAXIMUM - GAMEPAD_MINIMUM;
      axes.magnitude = clampUp(
        (axes.magnitude - GAMEPAD_MINIMUM) / gamepadRange,
      );
      axes.x = clamp(axes.x, -1, 1);
      axes.y = clamp(axes.y, -1, 1);
    }
    return axes;
  }

  //  Return the value of a button.
  getButton(button: ControllerButton): number {
    const gamepad = navigator.getGamepads()[0];
    return gamepad?.buttons[button]?.value ?? 0;
  }

  /**
   * Gets standardized movement input from WASD keys, arrow keys, or gamepad left stick.
   * Combines keyboard and gamepad input with proper priority handling.
   * @returns Movement vector with components clamped to [-1, 1] range
   */
  getMovementVector(): V2d {
    const result = V(0, 0);

    if (this.usingGamepad) {
      result.iadd(this.getStick("left"));
    }

    if (this.isKeyDown("KeyW") || this.isKeyDown("ArrowUp")) {
      result[1] -= 1;
    }
    if (this.isKeyDown("KeyD") || this.isKeyDown("ArrowRight")) {
      result[0] += 1;
    }
    if (this.isKeyDown("KeyS") || this.isKeyDown("ArrowDown")) {
      result[1] += 1;
    }
    if (this.isKeyDown("KeyA") || this.isKeyDown("ArrowLeft")) {
      result[0] -= 1;
    }

    result[0] = clamp(result[0], -1, 1);
    result[1] = clamp(result[1], -1, 1);

    return result;
  }
}

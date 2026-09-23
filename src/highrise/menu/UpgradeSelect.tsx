import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerAxis, ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import { markSeen } from "../persistence/SaveData";
import { Upgrade } from "../upgrades/Upgrade";
import "./menu.css";

// How far the stick has to go to move the selection, and how far back it has
// to come before it can move it again
const STICK_PRESS = 0.6;
const STICK_RELEASE = 0.3;
// Seconds before a pick counts, so a shot fired as the screen appears doesn't take something
const INPUT_DELAY = 0.4;

/**
 * Between floors: offers some upgrades and waits for the player to take one.
 * The game is paused while it's up. `picked` resolves with the choice.
 */
export default class UpgradeSelect extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Game;
  pausable = false;

  selected = 0;
  readonly picked: Promise<Upgrade>;
  private resolvePick!: (upgrade: Upgrade) => void;
  private done = false;
  private shownAt = 0;
  private stickHeld = false;

  constructor(readonly choices: ReadonlyArray<Upgrade>) {
    super(() => this.renderContent());
    this.picked = new Promise((resolve) => (this.resolvePick = resolve));
  }

  renderContent() {
    const usingGamepad = this.game.io.usingGamepad;
    const confirmButton = usingGamepad ? "A" : "Enter";
    return (
      <div className="menu-screen upgrade-select">
        <div className="upgrade-select__title">Take one</div>
        <div className="upgrade-select__cards">
          {this.choices.map((upgrade, i) => (
            <div
              key={upgrade.name}
              className={`upgrade-select__card upgrade-select__card--${upgrade.rarity} ${
                i === this.selected ? "upgrade-select__card--selected" : ""
              }`}
              onMouseEnter={() => this.select(i)}
              onClick={() => {
                this.select(i);
                this.confirm();
              }}
            >
              <div className="upgrade-select__rarity">{upgrade.rarity}</div>
              <div className="upgrade-select__name">{upgrade.name}</div>
              <div className="upgrade-select__description">
                {upgrade.description}
              </div>
            </div>
          ))}
        </div>
        <div className="upgrade-select__hint">
          {confirmButton} to take it · the others are gone for good
        </div>
      </div>
    );
  }

  @on("add")
  onAdd(data: { game: Game }) {
    super.onAdd(data);
    this.shownAt = data.game.elapsedTime;
    data.game.pause();
    // Reading an offer is enough for the encyclopedia
    for (const upgrade of this.choices) {
      markSeen("upgrades", upgrade.name);
    }
  }

  select(index: number) {
    if (!this.done) {
      this.selected = (index + this.choices.length) % this.choices.length;
    }
  }

  confirm() {
    const tooSoon = this.game.elapsedTime - this.shownAt < INPUT_DELAY;
    if (this.done || tooSoon || this.choices.length === 0) {
      return;
    }
    this.done = true;
    this.game.unpause();
    this.resolvePick(this.choices[this.selected]);
    this.destroy();
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    switch (key) {
      case "ArrowLeft":
      case "KeyA":
      case "ArrowUp":
      case "KeyW":
        return this.select(this.selected - 1);
      case "ArrowRight":
      case "KeyD":
      case "ArrowDown":
      case "KeyS":
        return this.select(this.selected + 1);
      case "Digit1":
      case "Digit2":
      case "Digit3": {
        const index = Number(key.slice(-1)) - 1;
        if (index < this.choices.length) {
          this.select(index);
          this.confirm();
        }
        return;
      }
      case "Enter":
      case "Space":
        return this.confirm();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    switch (button) {
      case ControllerButton.D_LEFT:
      case ControllerButton.D_UP:
        return this.select(this.selected - 1);
      case ControllerButton.D_RIGHT:
      case ControllerButton.D_DOWN:
        return this.select(this.selected + 1);
      case ControllerButton.A:
        return this.confirm();
    }
  }

  // The left stick moves the selection once per push. Ticks keep running for
  // entities that aren't pausable.
  @on("tick")
  onTick() {
    const io = this.game.io;
    if (!io.usingGamepad) {
      return;
    }
    const x = io.getAxis(ControllerAxis.LEFT_X);
    const y = io.getAxis(ControllerAxis.LEFT_Y);
    const push = Math.abs(x) > Math.abs(y) ? x : y;
    if (this.stickHeld) {
      if (Math.abs(x) < STICK_RELEASE && Math.abs(y) < STICK_RELEASE) {
        this.stickHeld = false;
      }
    } else if (Math.abs(push) >= STICK_PRESS) {
      this.stickHeld = true;
      this.select(this.selected + Math.sign(push));
    }
  }
}

/** Whether an upgrade screen is up (and owns the pause) */
export function isUpgradeSelectOpen(game: Game): boolean {
  return game.entities
    .getByConstructor(UpgradeSelect)
    .some((screen) => !screen.isDestroyed);
}

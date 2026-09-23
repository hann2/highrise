import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import { RunPlan } from "../run/RunPlan";
import "./menu.css";

// Seconds before a close counts, so the E that opened it doesn't also close it
const INPUT_DELAY = 0.3;

/**
 * The building directory, read off a plaque in a floor's spawn room: the
 * floors of the run, top floor first, with where you are marked. The game is
 * paused while it's up.
 */
export default class FloorDirectory extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Floor;
  pausable = false;

  private shownAt = 0;
  private done = false;

  constructor(
    readonly plan: RunPlan,
    /** The floor number the plaque is on */
    readonly currentFloor: number,
  ) {
    super(() => this.renderContent());
  }

  renderContent() {
    const closeButton = this.game.io.usingGamepad ? "B" : "Esc";
    const floors = [...this.plan].reverse();
    return (
      <div className="menu-screen floor-directory">
        <div className="floor-directory__plaque">
          <div className="floor-directory__title">Directory</div>
          <div className="floor-directory__rows">
            {floors.map((floor) =>
              this.renderRow(floor.number, floor.name, floor.notes),
            )}
            {this.renderRow(0, "Lobby", [])}
          </div>
        </div>
        <div className="floor-directory__hint">{closeButton} to close</div>
      </div>
    );
  }

  private renderRow(number: number, name: string, notes: readonly string[]) {
    const here = number === this.currentFloor;
    const classes = [
      "floor-directory__row",
      here ? "floor-directory__row--here" : "",
      number < this.currentFloor ? "floor-directory__row--done" : "",
    ];
    return (
      <div key={number} className={classes.join(" ")}>
        <div className="floor-directory__number">
          {number === 0 ? "L" : number}
        </div>
        <div className="floor-directory__name">{name}</div>
        <div className="floor-directory__notes">
          {here ? "◀ You are here" : notes.join(" · ")}
        </div>
      </div>
    );
  }

  @on("add")
  onAdd(data: { game: Game }) {
    super.onAdd(data);
    this.shownAt = data.game.elapsedTime;
    data.game.pause();
  }

  close() {
    const tooSoon = this.game.elapsedTime - this.shownAt < INPUT_DELAY;
    if (this.done || tooSoon) {
      return;
    }
    this.done = true;
    this.game.unpause();
    this.destroy();
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    switch (key) {
      case "Escape":
      case "Enter":
      case "Space":
      case "KeyE":
        return this.close();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    switch (button) {
      case ControllerButton.A:
      case ControllerButton.B:
      case ControllerButton.START:
        return this.close();
    }
  }
}

/** Whether the directory is up (and owns the pause) */
export function isFloorDirectoryOpen(game: Game): boolean {
  return game.entities
    .getByConstructor(FloorDirectory)
    .some((screen) => !screen.isDestroyed);
}

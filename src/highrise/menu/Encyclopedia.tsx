import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerAxis, ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import {
  ENCYCLOPEDIA_SECTIONS,
  EncyclopediaEntry,
} from "../encyclopedia/encyclopediaSections";
import { loadSaveData } from "../persistence/SaveData";
import "./menu.css";
import { MenuButton } from "./MenuButtons";

// How far the stick has to go to move the selection, and how far back it has
// to come before it can move it again
const STICK_PRESS = 0.6;
const STICK_RELEASE = 0.3;

/**
 * Everything in the game, with what the player has come across revealed and
 * the rest as "???". Opened over the main menu, the pause menu, or the run
 * summary, which ignore input while it's up (see `isEncyclopediaOpen`) and
 * get it back once it closes.
 */
export default class Encyclopedia extends ReactEntity implements Entity {
  pausable = false;

  /** Index into ENCYCLOPEDIA_SECTIONS */
  tab = 0;
  /** The selected entry in each section */
  selected: number[] = ENCYCLOPEDIA_SECTIONS.map(() => 0);
  /** Found flags only change during play, so they're read once */
  readonly sections: { title: string; entries: EncyclopediaEntry[] }[];
  private closing = false;
  private stickHeld = false;
  /** Set when the selection moves, so the list scrolls to it once */
  private scrollToSelection = false;

  constructor(persistenceLevel: Persistence) {
    super(() => this.renderContent());
    this.persistenceLevel = persistenceLevel;
    const save = loadSaveData();
    this.sections = ENCYCLOPEDIA_SECTIONS.map((section) => ({
      title: section.title,
      entries: section.getEntries(save),
    }));
  }

  get entries(): EncyclopediaEntry[] {
    return this.sections[this.tab].entries;
  }

  get entry(): EncyclopediaEntry | undefined {
    return this.entries[this.selected[this.tab]];
  }

  renderContent() {
    const usingGamepad = this.game.io.usingGamepad;
    const tabKeys = usingGamepad ? "LB / RB" : "← →";
    const entryKeys = usingGamepad ? "D-pad" : "↑ ↓";
    const backButton = usingGamepad ? "B" : "Esc";
    return (
      <div className="menu-screen encyclopedia">
        <div className="encyclopedia__title">Encyclopedia</div>
        <div className="encyclopedia__tabs">
          {this.sections.map((section, i) => (
            <div
              key={section.title}
              className={`encyclopedia__tab ${i === this.tab ? "encyclopedia__tab--selected" : ""}`}
              onClick={() => this.selectTab(i)}
            >
              {section.title}
              <span className="encyclopedia__count">
                {section.entries.filter((entry) => entry.found).length} /{" "}
                {section.entries.length}
              </span>
            </div>
          ))}
        </div>
        <div className="encyclopedia__body">
          <div className="encyclopedia__list">
            {this.entries.map((entry, i) => {
              const selected = i === this.selected[this.tab];
              return (
                <div
                  key={entry.name}
                  className={`encyclopedia__entry ${selected ? "encyclopedia__entry--selected" : ""} ${
                    entry.found ? "" : "encyclopedia__entry--unknown"
                  }`}
                  ref={selected ? (el) => this.scrollIntoView(el) : undefined}
                  onMouseEnter={() => this.selectEntry(i, false)}
                  onClick={() => this.selectEntry(i, false)}
                >
                  <div className="encyclopedia__entry-image">
                    {this.renderImage(entry)}
                  </div>
                  {entry.found ? entry.name : "???"}
                </div>
              );
            })}
          </div>
          {this.renderDetail()}
        </div>
        <div className="encyclopedia__footer">
          <MenuButton onClick={() => this.close()}>Back</MenuButton>
          <div className="encyclopedia__hint">
            {tabKeys} sections · {entryKeys} entries · {backButton} to go back
          </div>
        </div>
      </div>
    );
  }

  renderImage(entry: EncyclopediaEntry) {
    if (!entry.image) {
      return null;
    }
    // Unfound things show as a silhouette
    const classes = [
      entry.rotateImage ? "encyclopedia__image--rotated" : "",
      entry.found ? "" : "encyclopedia__image--silhouette",
    ];
    return <img src={entry.image} className={classes.join(" ")} />;
  }

  renderDetail() {
    const entry = this.entry;
    if (!entry) {
      return <div className="encyclopedia__detail" />;
    }
    if (!entry.found) {
      return (
        <div className="encyclopedia__detail encyclopedia__detail--unknown">
          <div className="encyclopedia__detail-image">
            {this.renderImage(entry)}
          </div>
          <div className="encyclopedia__detail-name">???</div>
          <div className="encyclopedia__description">Not found yet.</div>
        </div>
      );
    }
    return (
      <div className="encyclopedia__detail">
        <div className="encyclopedia__detail-image">
          {this.renderImage(entry)}
        </div>
        <div className="encyclopedia__detail-name">{entry.name}</div>
        {entry.tag && (
          <div
            className={`encyclopedia__tag encyclopedia__tag--${entry.tag.toLowerCase().replace(/ /g, "-")}`}
          >
            {entry.tag}
          </div>
        )}
        {entry.description && (
          <div className="encyclopedia__description">{entry.description}</div>
        )}
        {entry.stats.length > 0 && (
          <div className="encyclopedia__stats">
            {entry.stats.map(([label, value]) => [
              <div key={`${label}-label`} className="encyclopedia__stat-label">
                {label}
              </div>,
              <div key={`${label}-value`} className="encyclopedia__stat-value">
                {value}
              </div>,
            ])}
          </div>
        )}
      </div>
    );
  }

  private scrollIntoView(el: HTMLElement | null) {
    if (el && this.scrollToSelection) {
      this.scrollToSelection = false;
      el.scrollIntoView({ block: "nearest" });
    }
  }

  selectTab(index: number) {
    const count = this.sections.length;
    this.tab = (index + count) % count;
    this.scrollToSelection = true;
  }

  selectEntry(index: number, scroll = true) {
    const count = this.entries.length;
    if (count > 0) {
      this.selected[this.tab] = (index + count) % count;
      this.scrollToSelection = scroll;
    }
  }

  moveEntry(delta: number) {
    this.selectEntry(this.selected[this.tab] + delta);
  }

  /**
   * Closes on the next frame rather than right away, so that the key press
   * that closes it still finds it open in the screen underneath's handlers.
   */
  close() {
    this.closing = true;
  }

  @on("render")
  onRender(dt: number) {
    if (this.closing) {
      this.destroy();
      return;
    }
    super.onRender(dt);
  }

  @on("add")
  onAdd(data: { game: Game }) {
    super.onAdd(data);
    this.scrollToSelection = true;
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    switch (key) {
      case "ArrowLeft":
      case "KeyA":
        return this.selectTab(this.tab - 1);
      case "ArrowRight":
      case "KeyD":
        return this.selectTab(this.tab + 1);
      case "ArrowUp":
      case "KeyW":
        return this.moveEntry(-1);
      case "ArrowDown":
      case "KeyS":
        return this.moveEntry(1);
      case "Escape":
      case "Backspace":
        return this.close();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    switch (button) {
      case ControllerButton.LB:
      case ControllerButton.D_LEFT:
        return this.selectTab(this.tab - 1);
      case ControllerButton.RB:
      case ControllerButton.D_RIGHT:
        return this.selectTab(this.tab + 1);
      case ControllerButton.D_UP:
        return this.moveEntry(-1);
      case ControllerButton.D_DOWN:
        return this.moveEntry(1);
      case ControllerButton.B:
        return this.close();
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
    if (this.stickHeld) {
      if (Math.abs(x) < STICK_RELEASE && Math.abs(y) < STICK_RELEASE) {
        this.stickHeld = false;
      }
    } else if (Math.abs(x) >= STICK_PRESS || Math.abs(y) >= STICK_PRESS) {
      this.stickHeld = true;
      if (Math.abs(x) > Math.abs(y)) {
        this.selectTab(this.tab + Math.sign(x));
      } else {
        this.moveEntry(Math.sign(y));
      }
    }
  }
}

/** Whether the encyclopedia is up, in which case the screen underneath ignores input */
export function isEncyclopediaOpen(game: Game): boolean {
  return game.entities
    .getByConstructor(Encyclopedia)
    .some((screen) => !screen.isDestroyed);
}

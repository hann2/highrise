import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerAxis, ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import {
  antialiasFor,
  getDefinition,
  SETTING_IDS,
  SettingId,
  SETTINGS_TABS,
  SettingOption,
  SettingValue,
} from "../settings/settings";
import { getSettings } from "../settings/SettingsController";
import "./menu.css";
import { MenuButton } from "./MenuButtons";
import "./settings.css";

// How far the stick has to go to move the selection, and how far back it has
// to come before it can move it again
const STICK_PRESS = 0.6;
const STICK_RELEASE = 0.3;

/**
 * The settings (see `settings/settings.ts`): tabs along the top, the tab's
 * settings in a list, and what the selected one does underneath. Changes
 * apply as they're made. It's a panel down the left side, so from the pause
 * menu the paused game shows next to it and graphics changes can be seen.
 * Opened over the title screen or the pause menu, which ignore input while
 * it's up (see `isSettingsOpen`) and get it back once it closes.
 */
export default class SettingsScreen extends ReactEntity implements Entity {
  pausable = false;

  /** Index into SETTINGS_TABS */
  tab = 0;
  /** The selected row in each tab */
  selected: number[] = SETTINGS_TABS.map(() => 0);
  private closing = false;
  private stickHeld = false;

  constructor(persistenceLevel: Persistence) {
    super(() => this.renderContent());
    this.persistenceLevel = persistenceLevel;
  }

  /** The settings on the current tab that are offered here */
  get rows(): SettingId[] {
    const tab = SETTINGS_TABS[this.tab];
    return SETTING_IDS.filter((id) => {
      const definition = getDefinition(id);
      return (
        definition.tab === tab &&
        (definition.available?.() ?? true) &&
        definition.options().length > 0
      );
    });
  }

  get selectedId(): SettingId | undefined {
    return this.rows[this.selected[this.tab]];
  }

  renderContent() {
    const usingGamepad = this.game.io.usingGamepad;
    const tabKeys = usingGamepad ? "LB / RB" : "Q / E";
    const rowKeys = usingGamepad ? "D-pad" : "↑ ↓ ← →";
    const backButton = usingGamepad ? "B" : "Esc";
    return (
      <div className="menu-screen settings">
        <div className="settings__panel">
          <div className="settings__title">Settings</div>
          <div className="settings__tabs">
            {SETTINGS_TABS.map((tab, i) => (
              <div
                key={tab}
                className={`settings__tab ${i === this.tab ? "settings__tab--selected" : ""}`}
                onClick={() => this.selectTab(i)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className="settings__list">
            {this.rows.length === 0 && (
              <div className="settings__empty">Nothing here yet.</div>
            )}
            {this.rows.map((id, i) => this.renderRow(id, i))}
          </div>
          {this.renderDetail()}
          <div className="settings__footer">
            <MenuButton onClick={() => this.close()}>Back</MenuButton>
            <MenuButton onClick={() => this.resetTab()}>Reset Tab</MenuButton>
            <div className="settings__hint">
              {tabKeys} tabs · {rowKeys} change · {backButton} to go back
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderRow(id: SettingId, index: number) {
    const definition = getDefinition(id);
    const selected = index === this.selected[this.tab];
    const options = this.optionsFor(id);
    const value = getSettings(this.game).get(id);
    const current = options.findIndex((option) => option.value === value);
    return (
      <div
        key={id}
        className={`settings__row ${selected ? "settings__row--selected" : ""}`}
        onMouseEnter={() => this.selectRow(index)}
      >
        <div className="settings__label">
          {definition.label}
          {this.waitingForRestart(id) && (
            <span className="settings__pending">on restart</span>
          )}
        </div>
        <div className="settings__control">
          <div className="settings__arrow" onClick={() => this.step(id, -1)}>
            ◀
          </div>
          <div className="settings__value" onClick={() => this.step(id, 1)}>
            {definition.bar ? (
              // A step for each value but the lowest, which is none lit
              <div className="settings__bar">
                {options.slice(1).map((option, i) => (
                  <div
                    key={String(option.value)}
                    className={`settings__bar-step ${i < current ? "settings__bar-step--on" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      this.setValue(id, option.value);
                    }}
                  />
                ))}
                <div className="settings__bar-label">
                  {options[current]?.label}
                </div>
              </div>
            ) : (
              (options[current]?.label ?? String(value))
            )}
          </div>
          <div className="settings__arrow" onClick={() => this.step(id, 1)}>
            ▶
          </div>
        </div>
      </div>
    );
  }

  renderDetail() {
    const id = this.selectedId;
    if (!id) {
      return <div className="settings__detail" />;
    }
    const definition = getDefinition(id);
    const when =
      definition.takesEffect === "restart"
        ? "Takes effect the next time the game starts."
        : definition.takesEffect === "nextFloor"
          ? "Takes effect on the next floor."
          : undefined;
    return (
      <div className="settings__detail">
        <div className="settings__description">{definition.description}</div>
        {definition.cost && (
          <div className="settings__cost">
            <span className="settings__cost-label">Cost</span>
            {definition.cost}
          </div>
        )}
        {when && <div className="settings__when">{when}</div>}
      </div>
    );
  }

  optionsFor(id: SettingId): SettingOption<SettingValue>[] {
    return getDefinition(id).options(this.game);
  }

  /** Whether a setting that takes a restart has been changed from what's running */
  waitingForRestart(id: SettingId): boolean {
    if (id === "antialias") {
      const wanted = antialiasFor(getSettings(this.game).get("antialias"));
      return wanted !== this.game.renderer.antialias;
    }
    return false;
  }

  /** The next or previous value: bars stop at their ends, lists go round */
  step(id: SettingId, delta: number) {
    const options = this.optionsFor(id);
    if (options.length === 0) {
      return;
    }
    const value = getSettings(this.game).get(id);
    const current = options.findIndex((option) => option.value === value);
    let next: number;
    if (current < 0) {
      next = 0;
    } else if (getDefinition(id).bar) {
      next = Math.max(0, Math.min(options.length - 1, current + delta));
    } else {
      next = (current + delta + options.length) % options.length;
    }
    if (next !== current) {
      this.setValue(id, options[next].value);
    }
  }

  setValue(id: SettingId, value: SettingValue) {
    // The value is one of the setting's own options
    getSettings(this.game).set(id, value as never);
  }

  resetTab() {
    const settings = getSettings(this.game);
    for (const id of this.rows) {
      const definition = getDefinition(id);
      if (settings.get(id) !== definition.default) {
        settings.set(id, definition.default as never);
      }
    }
  }

  selectTab(index: number) {
    const count = SETTINGS_TABS.length;
    this.tab = (index + count) % count;
  }

  selectRow(index: number) {
    const count = this.rows.length;
    if (count > 0) {
      this.selected[this.tab] = (index + count) % count;
    }
  }

  moveRow(delta: number) {
    this.selectRow(this.selected[this.tab] + delta);
  }

  stepSelected(delta: number) {
    const id = this.selectedId;
    if (id) {
      this.step(id, delta);
    }
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

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    switch (key) {
      case "KeyQ":
        return this.selectTab(this.tab - 1);
      case "KeyE":
        return this.selectTab(this.tab + 1);
      case "ArrowUp":
      case "KeyW":
        return this.moveRow(-1);
      case "ArrowDown":
      case "KeyS":
        return this.moveRow(1);
      case "ArrowLeft":
      case "KeyA":
        return this.stepSelected(-1);
      case "ArrowRight":
      case "KeyD":
      case "Enter":
      case "Space":
        return this.stepSelected(1);
      case "Escape":
      case "Backspace":
        return this.close();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    switch (button) {
      case ControllerButton.LB:
        return this.selectTab(this.tab - 1);
      case ControllerButton.RB:
        return this.selectTab(this.tab + 1);
      case ControllerButton.D_UP:
        return this.moveRow(-1);
      case ControllerButton.D_DOWN:
        return this.moveRow(1);
      case ControllerButton.D_LEFT:
        return this.stepSelected(-1);
      case ControllerButton.D_RIGHT:
      case ControllerButton.A:
        return this.stepSelected(1);
      case ControllerButton.B:
        return this.close();
    }
  }

  // The left stick moves the selection or changes the value once per push.
  // Ticks keep running for entities that aren't pausable.
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
        this.stepSelected(Math.sign(x));
      } else {
        this.moveRow(Math.sign(y));
      }
    }
  }
}

/** Whether the settings are up, in which case the screen underneath ignores input */
export function isSettingsOpen(game: Game): boolean {
  return game.entities
    .getByConstructor(SettingsScreen)
    .some((screen) => !screen.isDestroyed);
}

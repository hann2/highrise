import { RESOURCES } from "../../../resources/resources";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerAxis, ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { smoothStep } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { Character, CHARACTERS } from "../characters/Character";
import { Persistence } from "../constants/constants";
import { loadSaveData } from "../persistence/SaveData";
import "./menu.css";

const COLUMNS = 7;
const FADE_TIME = 0.4;
// How far the stick has to go to move the selection, and how far back it has
// to come before it can move it again
const STICK_PRESS = 0.6;
const STICK_RELEASE = 0.3;

/**
 * Pick who to play as, between the main menu and the game. Characters who
 * haven't been rescued yet show as silhouettes and can be looked at but not
 * picked.
 */
export default class CharacterSelect extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Floor;
  pausable = false;

  selected = 0;
  opacity = 0;
  inTransition = false;
  private stickHeld = false;
  private voiceLine?: SoundInstance;

  constructor() {
    super(() => this.renderContent());
  }

  get character(): Character {
    return CHARACTERS[this.selected];
  }

  /** Read fresh every time, so the unlock cheat shows up straight away */
  private getUnlocked(): Set<string> {
    return new Set(loadSaveData().unlockedCharacters);
  }

  isUnlocked(character: Character): boolean {
    return this.getUnlocked().has(character.name);
  }

  renderContent() {
    const confirmButton = this.game.io.usingGamepad ? "A" : "Enter";
    const backButton = this.game.io.usingGamepad ? "B" : "Esc";
    const unlocked = this.getUnlocked();
    const unlockedCount = CHARACTERS.filter((c) => unlocked.has(c.name)).length;
    const selectedUnlocked = unlocked.has(this.character.name);
    return (
      <div
        className={`menu-screen ${this.inTransition ? "menu-screen--inactive" : ""}`}
        style={{ opacity: this.opacity }}
      >
        <div className="character-select">
          <div className="character-select__title">Who are you?</div>
          <div
            className="character-select__grid"
            style={{ gridTemplateColumns: `repeat(${COLUMNS}, auto)` }}
          >
            {CHARACTERS.map((character, i) => (
              <div
                key={character.name}
                className={`character-select__portrait ${
                  i === this.selected
                    ? "character-select__portrait--selected"
                    : ""
                } ${
                  unlocked.has(character.name)
                    ? ""
                    : "character-select__portrait--locked"
                }`}
                onMouseEnter={() => this.select(i)}
                onClick={() => {
                  this.select(i);
                  this.confirm();
                }}
              >
                <img src={RESOURCES.images[character.textures.head]} />
              </div>
            ))}
          </div>
          <div className="character-select__name">
            {selectedUnlocked ? this.character.name : "???"}
          </div>
          <div className="character-select__hint">
            {selectedUnlocked
              ? `${confirmButton} to start · ${backButton} to go back`
              : `Rescue them to unlock · ${backButton} to go back`}
          </div>
          <div className="character-select__count">
            {unlockedCount} / {CHARACTERS.length} survivors
          </div>
        </div>
      </div>
    );
  }

  @on("add")
  async onAdd(data: { game: Game }) {
    super.onAdd(data);
    await this.wait(FADE_TIME, (_, t) => {
      this.opacity = smoothStep(t);
    });
  }

  @on("destroy")
  onDestroy(data: { game: Game }) {
    this.voiceLine?.destroy();
    super.onDestroy(data);
  }

  select(index: number) {
    if (this.inTransition || index === this.selected) {
      return;
    }
    this.selected = (index + CHARACTERS.length) % CHARACTERS.length;
    this.voiceLine?.destroy();
    if (!this.isUnlocked(this.character)) {
      return;
    }
    // Not everyone has misc lines yet
    const { misc, newLevel, joinParty } = this.character.sounds;
    const lines = [misc, newLevel, joinParty].find((l) => l.length > 0);
    if (lines) {
      this.voiceLine = this.game.addEntity(
        new SoundInstance(choose(...lines), {
          persistenceLevel: Persistence.Floor,
        }),
      );
    }
  }

  move(dx: number, dy: number) {
    const row = Math.floor(this.selected / COLUMNS);
    const column = this.selected % COLUMNS;
    const rows = Math.ceil(CHARACTERS.length / COLUMNS);
    if (dy !== 0) {
      const newRow = (row + dy + rows) % rows;
      // The last row may be short
      this.select(Math.min(newRow * COLUMNS + column, CHARACTERS.length - 1));
    } else {
      this.select(this.selected + dx);
    }
  }

  async confirm() {
    if (!this.inTransition && this.isUnlocked(this.character)) {
      this.inTransition = true;
      const character = this.character;
      await this.wait(FADE_TIME, (_, t) => {
        this.opacity = smoothStep(1 - t);
      });
      this.game.dispatch("newGame", { character });
      this.destroy();
    }
  }

  async back() {
    if (!this.inTransition) {
      this.inTransition = true;
      await this.wait(FADE_TIME, (_, t) => {
        this.opacity = smoothStep(1 - t);
      });
      this.game.dispatch("goToMainMenu", undefined);
    }
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    switch (key) {
      case "ArrowLeft":
      case "KeyA":
        return this.move(-1, 0);
      case "ArrowRight":
      case "KeyD":
        return this.move(1, 0);
      case "ArrowUp":
      case "KeyW":
        return this.move(0, -1);
      case "ArrowDown":
      case "KeyS":
        return this.move(0, 1);
      case "Enter":
      case "Space":
        return this.confirm();
      case "Escape":
        return this.back();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    switch (button) {
      case ControllerButton.D_LEFT:
        return this.move(-1, 0);
      case ControllerButton.D_RIGHT:
        return this.move(1, 0);
      case ControllerButton.D_UP:
        return this.move(0, -1);
      case ControllerButton.D_DOWN:
        return this.move(0, 1);
      case ControllerButton.A:
      case ControllerButton.START:
        return this.confirm();
      case ControllerButton.B:
        return this.back();
    }
  }

  // The left stick moves the selection once per push
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
        this.move(Math.sign(x), 0);
      } else {
        this.move(0, Math.sign(y));
      }
    }
  }
}

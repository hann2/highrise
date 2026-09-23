import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { smoothStep } from "../../core/util/MathUtil";
import { Persistence } from "../constants/constants";
import { RunSummary } from "../persistence/SaveData";
import "./menu.css";
import { MenuButton } from "./MenuButtons";

const FADE_IN_TIME = 1.5;
const STATS_FADE_IN_TIME = 0.6;
const FADE_OUT_TIME = 1.0;

const TITLES: Record<RunSummary["outcome"], string> = {
  victory: "You Win",
  died: "You Died",
  quit: "Run Over",
};

/**
 * The run summary: fades in over the game, stays until the player continues,
 * then fades out. `GameController` clears the game away behind it once it is
 * opaque and goes back to the main menu once it is destroyed.
 */
export default class GameOverScreen extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Menu;
  pausable = false;
  /** Of the whole screen */
  opacity = 0;
  /** Of everything but the title and background */
  statsOpacity = 0;
  /** Accepting input to continue */
  ready = false;
  private leaving = false;

  constructor(
    public summary: RunSummary,
    /** The best floor from before this run, to call out a new record */
    private previousBestFloor: number,
  ) {
    super(() => this.renderContent());
  }

  renderContent() {
    const { summary } = this;
    const victory = summary.outcome === "victory";
    const continueButton = this.game.io.usingGamepad ? "A" : "Enter";
    return (
      <div
        className={`menu-screen run-summary ${victory ? "run-summary--victory" : ""} ${
          this.ready ? "" : "menu-screen--inactive"
        }`}
        style={{ opacity: this.opacity }}
      >
        <div className="run-summary__title">{TITLES[summary.outcome]}</div>
        <div
          className="run-summary__body"
          style={{ opacity: this.statsOpacity }}
        >
          <div className="run-summary__stats">
            {this.renderStats().map(([label, value]) => [
              <div key={`${label}-label`} className="run-summary__label">
                {label}
              </div>,
              <div key={`${label}-value`} className="run-summary__value">
                {value}
              </div>,
            ])}
          </div>
          {this.renderCallouts()}
          <MenuButton onClick={() => this.continue()}>Main Menu</MenuButton>
          <div className="run-summary__hint">
            Press {continueButton} to continue
          </div>
        </div>
      </div>
    );
  }

  renderStats(): [string, string][] {
    const { summary } = this;
    const stats: [string, string][] = [
      ["Character", summary.character],
      ["Floor reached", String(summary.floorReached)],
      ["Time", formatTime(summary.timeSeconds)],
    ];
    if (summary.causeOfDeath) {
      stats.push(["Killed by", summary.causeOfDeath]);
    }
    stats.push(["Kills", formatKills(summary.kills)]);
    stats.push([
      "Quarters",
      `${summary.quartersCollected} found, ${summary.quartersSpent} spent`,
    ]);
    if (summary.upgrades.length > 0) {
      stats.push(["Upgrades", summary.upgrades.join(", ")]);
    }
    return stats;
  }

  renderCallouts() {
    const { summary } = this;
    const callouts: string[] = [];
    if (summary.floorReached > this.previousBestFloor) {
      callouts.push(`New best: floor ${summary.floorReached}!`);
    }
    for (const name of summary.charactersUnlocked) {
      callouts.push(`Unlocked ${name}!`);
    }
    return callouts.map((callout) => (
      <div key={callout} className="run-summary__callout">
        {callout}
      </div>
    ));
  }

  @on("add")
  async onAdd(data: { game: Game }) {
    super.onAdd(data);
    await this.wait(FADE_IN_TIME, (_, t) => {
      this.opacity = smoothStep(t);
    });
    this.opacity = 1;
    await this.wait(STATS_FADE_IN_TIME, (_, t) => {
      this.statsOpacity = smoothStep(t);
    });
    this.statsOpacity = 1;
    this.ready = true;
  }

  async continue() {
    if (this.ready && !this.leaving) {
      this.leaving = true;
      this.ready = false;
      await this.wait(FADE_OUT_TIME, (_, t) => {
        this.opacity = smoothStep(1 - t);
      });
      this.destroy();
    }
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "Enter" || key === "Space" || key === "Escape") {
      this.continue();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    if (button === ControllerButton.A || button === ControllerButton.START) {
      this.continue();
    }
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatKills(kills: Record<string, number>): string {
  const entries = Object.entries(kills).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) {
    return "None";
  }
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const breakdown = entries
    .map(([name, count]) => `${count} ${name}${count === 1 ? "" : "s"}`)
    .join(", ");
  return entries.length === 1 ? breakdown : `${total} (${breakdown})`;
}

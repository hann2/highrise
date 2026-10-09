import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { KeyCode } from "../../../core/io/Keys";
import ReactEntity from "../../../core/ReactEntity";
import { copyLoadout } from "../../arena/loadout";
import {
  Choices,
  LoadoutSections,
  Row,
  Section,
  Stepper,
  Toggle,
} from "../../arena/panelControls";
import "../../arena/arena.css";
import { isFloorDirectoryOpen } from "../../menu/FloorDirectory";
import { isStoreOpen } from "../../menu/StoreScreen";
import { BOSS_LEVELS } from "../bossLevels";
import type BossTestScene from "./BossTestScene";
import type { Attempt } from "./BossTestScene";
import { BOSS_FLOOR_NUMBERS, BossTestConfig } from "./bossTestConfig";

/** Fractions of their starting health the bosses can be set to */
const HEALTH_STEPS: [string, number][] = [
  ["Full", 1],
  ["Half", 0.5],
  ["10%", 0.1],
  ["1 HP", 0],
];

/**
 * The boss test scene's setup, opened with Tab (the game pauses meanwhile).
 * Changes to the setup are made to a copy and happen on Apply (Tab again, or
 * Enter), which starts the fight over; Escape leaves without changing
 * anything. The boss's health and the level's own buttons act on the fight as
 * it is, right away. While it's closed, a box in the corner shows the keys and
 * how the fight's going.
 */
export default class BossTestPanel extends ReactEntity implements Entity {
  pausable = false;
  open = false;
  /** The setup being edited */
  private draft?: BossTestConfig;
  private copied = false;

  constructor(private scene: BossTestScene) {
    super(() => (this.open ? this.renderPanel() : this.renderHint()));
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    // The store and the directory have the keys while they're open
    if (isStoreOpen(this.game) || isFloorDirectoryOpen(this.game)) {
      return;
    }
    if (key === "Tab") {
      if (this.open) {
        this.apply();
      } else {
        this.show();
      }
    } else if (key === "Escape") {
      if (this.open) {
        this.close();
      } else {
        this.game.togglePause();
      }
    } else if (key === "Enter" && this.open) {
      this.apply();
    }
  }

  show() {
    this.draft = copyLoadout(this.scene.config);
    this.open = true;
    this.copied = false;
    this.game.pause();
  }

  close() {
    this.open = false;
    this.draft = undefined;
    this.game.unpause();
  }

  apply() {
    const draft = this.draft;
    this.close();
    if (draft) {
      this.scene.apply(draft);
    }
  }

  private copyLink() {
    navigator.clipboard?.writeText(window.location.href);
    this.copied = true;
  }

  private renderHint() {
    const { config, attempt, lastAttempt } = this.scene;
    return (
      <div className="arena-hint">
        <div className="arena-hint__title">
          Boss test{this.game.paused ? " (paused)" : ""}
        </div>
        <div>
          {config.level.floorName} on floor {config.floor},{" "}
          {config.character.name}
        </div>
        {attempt.time > 0 && !attempt.outcome && (
          <div className="arena-hint__wave">
            Fighting: {describeAttempt(attempt)}
          </div>
        )}
        {lastAttempt && (
          <div className="arena-hint__wave">
            Last: {describeAttempt(lastAttempt)}
          </div>
        )}
        <div className="arena-hint__keys">
          Tab setup · Backspace start over · Shift-L kill the boss · Esc pause
        </div>
      </div>
    );
  }

  private renderPanel() {
    const draft = this.draft!;
    const actions = this.scene.debugActions();
    return (
      <div className="arena-panel">
        <div className="arena-panel__scroll">
          <div className="arena-panel__title">Boss test setup</div>

          <Section title="The fight">
            <Row label="Boss level">
              <Choices
                options={BOSS_LEVELS.map((level) => level.id)}
                value={draft.level.id}
                onChange={(id) => {
                  draft.level =
                    BOSS_LEVELS.find((level) => level.id === id) ?? draft.level;
                }}
              />
            </Row>
            <Row label="Floor">
              <Choices
                options={BOSS_FLOOR_NUMBERS}
                value={draft.floor}
                onChange={(floor) => (draft.floor = floor)}
              />
            </Row>
            <Row label="Quarters to start with">
              <Stepper
                value={draft.quarters}
                min={0}
                max={999}
                onChange={(n) => (draft.quarters = n)}
              />
            </Row>
          </Section>

          <Section title="Right now">
            <Row label="Boss health">
              {HEALTH_STEPS.map(([label, fraction]) => (
                <button onClick={() => this.scene.setBossHealth(fraction)}>
                  {label}
                </button>
              ))}
            </Row>
            {actions.length > 0 && (
              <Row label="">
                {actions.map((action) => (
                  <button onClick={() => action.run()}>{action.label}</button>
                ))}
              </Row>
            )}
          </Section>

          <LoadoutSections draft={draft} />

          <Section title="Options">
            <Toggle
              label="Can't die"
              value={draft.god}
              onChange={(v) => (draft.god = v)}
            />
            <Toggle
              label="Ammo, throwables and usables never run out"
              value={draft.infiniteAmmo}
              onChange={(v) => (draft.infiniteAmmo = v)}
            />
            <Toggle
              label="Bosses stand still"
              value={draft.frozen}
              onChange={(v) => (draft.frozen = v)}
            />
          </Section>
        </div>

        <div className="arena-panel__footer">
          <button className="arena-primary" onClick={() => this.apply()}>
            Apply and start over <kbd>Tab</kbd>
          </button>
          <button onClick={() => this.close()}>
            Cancel <kbd>Esc</kbd>
          </button>
          <button onClick={() => this.copyLink()}>
            {this.copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    );
  }
}

function describeAttempt(attempt: Attempt): string {
  const time = `${attempt.time.toFixed(1)} s`;
  const damage = `took ${Math.round(attempt.damageTaken)} damage`;
  switch (attempt.outcome) {
    case "won":
      return `won in ${time}, ${damage}`;
    case "died":
      return `died after ${time}`;
    default:
      return `${time}, ${damage}`;
  }
}

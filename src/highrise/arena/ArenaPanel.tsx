import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { ACT_COUNT } from "../run/acts";
import {
  ARENA_ENEMIES,
  ArenaConfig,
  ARRIVALS,
  LAYOUT_NAMES,
} from "./arenaConfig";
import "./arena.css";
import type ArenaScene from "./ArenaScene";
import { copyLoadout } from "./loadout";
import {
  Choices,
  LoadoutSections,
  Row,
  Section,
  Stepper,
  Toggle,
} from "./panelControls";

/**
 * The arena's setup, opened with Tab (the game pauses meanwhile). Changes are
 * made to a copy and only happen on Apply: Tab again, or Enter to also send a
 * wave. Escape leaves without changing anything. While it's closed, a box in
 * the corner shows the keys and how the wave is going.
 */
export default class ArenaPanel extends ReactEntity implements Entity {
  pausable = false;
  open = false;
  /** The setup being edited */
  private draft?: ArenaConfig;
  private copied = false;

  constructor(private scene: ArenaScene) {
    super(() => (this.open ? this.renderPanel() : this.renderHint()));
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
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
      this.scene.sendWave();
    }
  }

  show() {
    this.draft = copyConfig(this.scene.config);
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
    const config = this.scene.config;
    const wave = this.scene.wave;
    let waveText = "";
    if (wave) {
      // Alive rather than left of the wave: a necromancer brings more
      const coming = wave.toCome > 0 ? `, ${wave.toCome} coming` : "";
      waveText = wave.cleared
        ? `Wave of ${wave.size} cleared in ${wave.time.toFixed(1)} s`
        : `${wave.alive} alive${coming}, ${wave.time.toFixed(1)} s`;
      waveText += `, took ${Math.round(wave.damageTaken)} damage`;
    }
    return (
      <div className="arena-hint">
        <div className="arena-hint__title">
          Arena{this.game.paused ? " (paused)" : ""}
        </div>
        <div>
          {config.character.name}, act {config.act}, {config.layout}
        </div>
        {waveText && <div className="arena-hint__wave">{waveText}</div>}
        <div className="arena-hint__keys">
          Tab setup · Enter send wave · Backspace clear · Shift-Backspace reset
          · Q / Shift-Q next / previous weapon · Esc pause
        </div>
      </div>
    );
  }

  private renderPanel() {
    const draft = this.draft!;
    return (
      <div className="arena-panel">
        <div className="arena-panel__scroll">
          <div className="arena-panel__title">Arena setup</div>

          <LoadoutSections draft={draft} />

          <Section title="Enemies">
            <Row label="Act">
              <Choices
                options={Array.from({ length: ACT_COUNT }, (_, i) => i + 1)}
                value={draft.act}
                onChange={(act) => (draft.act = act)}
              />
            </Row>
            {ARENA_ENEMIES.map((type) => (
              <Row label={type.name}>
                <Stepper
                  value={draft.wave[type.name] ?? 0}
                  min={0}
                  max={99}
                  onChange={(n) => (draft.wave[type.name] = n)}
                />
              </Row>
            ))}
            <Row label="Arrival">
              <Choices
                options={ARRIVALS}
                value={draft.arrival}
                onChange={(arrival) => (draft.arrival = arrival)}
              />
            </Row>
            <Row label="Layout">
              <Choices
                options={LAYOUT_NAMES}
                value={draft.layout}
                onChange={(layout) => (draft.layout = layout)}
              />
            </Row>
          </Section>

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
              label="Enemies stand still (dummies)"
              value={draft.dummies}
              onChange={(v) => (draft.dummies = v)}
            />
            <Toggle
              label="Fog of war"
              value={draft.fog}
              onChange={(v) => (draft.fog = v)}
            />
            <Toggle
              label="Dark, like a floor"
              value={draft.dark}
              onChange={(v) => (draft.dark = v)}
            />
            <Toggle
              label="Doors in the doorways (offices, sprawl)"
              value={draft.doors}
              onChange={(v) => (draft.doors = v)}
            />
            <Row label="Fires that never go out">
              <Stepper
                value={draft.fires}
                min={0}
                max={99}
                onChange={(n) => (draft.fires = n)}
              />
            </Row>
            <Row label="Bullets this many times slower than real">
              <Stepper
                value={draft.bulletSlowdown}
                min={1}
                max={30}
                onChange={(n) => (draft.bulletSlowdown = n)}
              />
            </Row>
          </Section>
        </div>

        <div className="arena-panel__footer">
          <button className="arena-primary" onClick={() => this.apply()}>
            Apply <kbd>Tab</kbd>
          </button>
          <button
            onClick={() => {
              this.apply();
              this.scene.sendWave();
            }}
          >
            Apply + wave <kbd>Enter</kbd>
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

function copyConfig(config: ArenaConfig): ArenaConfig {
  return { ...copyLoadout(config), wave: { ...config.wave } };
}

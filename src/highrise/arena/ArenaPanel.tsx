import { ComponentChildren } from "preact";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { CHARACTERS } from "../characters/Character";
import { Item } from "../items/Item";
import { ACT_COUNT } from "../run/acts";
import { CONSUMABLES } from "../weapons/consumables/consumable-stats/consumableStats";
import { GUNS } from "../weapons/guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "../weapons/melee/melee-weapons/meleeWeapons";
import { USABLES } from "../weapons/usables/usables";
import { WEAPONS } from "../weapons/weapons";
import {
  ARENA_ENEMIES,
  ARENA_ITEMS,
  ArenaConfig,
  ARRIVALS,
  LAYOUT_NAMES,
  startingSlots,
} from "./arenaConfig";
import "./arena.css";
import type ArenaScene from "./ArenaScene";

const ITEM_GROUPS: [string, Item["category"]][] = [
  ["Equipment", "equipment"],
  ["Attachments", "attachment"],
  ["Boss items", "boss"],
];

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
    const itemCount = (item: Item) =>
      draft.items.filter((i) => i === item).length;
    const setItemCount = (item: Item, n: number) => {
      const current = itemCount(item);
      if (n > current) {
        draft.items = [...draft.items, ...Array<Item>(n - current).fill(item)];
      } else {
        // Keeps the order of the rest; the ones taken last go first
        let toKeep = n;
        draft.items = draft.items.filter((i) => i !== item || toKeep-- > 0);
      }
    };

    return (
      <div className="arena-panel">
        <div className="arena-panel__scroll">
          <div className="arena-panel__title">Arena setup</div>

          <Section title="Player">
            <Row label="Character">
              <select
                value={CHARACTERS.indexOf(draft.character)}
                onChange={(e) => {
                  draft.character = CHARACTERS[Number(e.currentTarget.value)];
                }}
              >
                {CHARACTERS.map((c, i) => (
                  <option value={i}>{c.name}</option>
                ))}
              </select>
            </Row>
            {[0, 1].map((slot) => (
              <Row label={`Slot ${slot + 1}`}>
                <select
                  value={WEAPONS.indexOf(draft.weapons[slot]!)}
                  onChange={(e) => {
                    const i = Number(e.currentTarget.value);
                    draft.weapons[slot] = i >= 0 ? WEAPONS[i] : undefined;
                  }}
                >
                  <option value={-1}>None</option>
                  <optgroup label="Guns">
                    {GUNS.map((gun) => (
                      <option value={WEAPONS.indexOf(gun)}>{gun.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Melee">
                    {MELEE_WEAPONS.map((weapon) => (
                      <option value={WEAPONS.indexOf(weapon)}>
                        {weapon.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </Row>
            ))}
            <Row label="">
              <button
                onClick={() => {
                  draft.weapons = startingSlots(draft.character);
                }}
              >
                Character's starting weapons
              </button>
            </Row>
            <Row label="Throwable">
              <select
                value={CONSUMABLES.indexOf(draft.throwable!)}
                onChange={(e) => {
                  const i = Number(e.currentTarget.value);
                  draft.throwable = i >= 0 ? CONSUMABLES[i] : undefined;
                  draft.throwableCount = draft.throwable
                    ? Math.max(1, draft.throwableCount)
                    : 0;
                }}
              >
                <option value={-1}>None</option>
                {CONSUMABLES.map((c, i) => (
                  <option value={i}>{c.name}</option>
                ))}
              </select>
              {draft.throwable && (
                <Stepper
                  value={draft.throwableCount}
                  min={1}
                  max={draft.throwable.maxCarry}
                  onChange={(n) => (draft.throwableCount = n)}
                />
              )}
            </Row>
            <Row label="Usable">
              <select
                value={USABLES.indexOf(draft.usable!)}
                onChange={(e) => {
                  const i = Number(e.currentTarget.value);
                  draft.usable = i >= 0 ? USABLES[i] : undefined;
                }}
              >
                <option value={-1}>None</option>
                {USABLES.map((u, i) => (
                  <option value={i}>{u.name}</option>
                ))}
              </select>
            </Row>
          </Section>

          <Section
            title="Items"
            action={
              draft.items.length > 0 && (
                <button onClick={() => (draft.items = [])}>Clear</button>
              )
            }
          >
            {ITEM_GROUPS.map(([title, category]) => (
              <>
                <div className="arena-panel__subtitle">{title}</div>
                {ARENA_ITEMS.filter((item) => item.category === category).map(
                  (item) => {
                    const n = itemCount(item);
                    return (
                      <div
                        className={
                          "arena-item" + (n > 0 ? " arena-item--taken" : "")
                        }
                        title={item.description}
                      >
                        <span className="arena-item__name">{item.name}</span>
                        {item.fits && item.fits.length < 3 && (
                          <span className="arena-item__fits">
                            {item.fits.join(", ")}
                          </span>
                        )}
                        <Stepper
                          value={n}
                          min={0}
                          max={item.maxStacks ?? 9}
                          onChange={(count) => setItemCount(item, count)}
                        />
                      </div>
                    );
                  },
                )}
              </>
            ))}
          </Section>

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
  return {
    ...config,
    weapons: [...config.weapons],
    items: [...config.items],
    wave: { ...config.wave },
  };
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <div className="arena-section">
      <div className="arena-section__title">
        {title}
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: ComponentChildren;
}) {
  return (
    <div className="arena-row">
      <span className="arena-row__label">{label}</span>
      <span className="arena-row__controls">{children}</span>
    </div>
  );
}

/** − n + ; shift-click steps by 5 */
function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const step = (e: MouseEvent, sign: number) => {
    const by = e.shiftKey ? 5 : 1;
    onChange(Math.min(max, Math.max(min, value + sign * by)));
  };
  return (
    <span className="arena-stepper">
      <button disabled={value <= min} onClick={(e) => step(e, -1)}>
        −
      </button>
      <span className="arena-stepper__value">{value}</span>
      <button disabled={value >= max} onClick={(e) => step(e, 1)}>
        +
      </button>
    </span>
  );
}

function Choices<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<T>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <span className="arena-choices">
      {options.map((option) => (
        <button
          className={option === value ? "arena-choices--selected" : ""}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </span>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="arena-toggle">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      {label}
    </label>
  );
}

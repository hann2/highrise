import { ComponentChildren } from "preact";
import { CHARACTERS } from "../characters/Character";
import { Item } from "../items/Item";
import { CONSUMABLES } from "../weapons/consumables/consumable-stats/consumableStats";
import { GUNS } from "../weapons/guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "../weapons/melee/melee-weapons/meleeWeapons";
import { USABLES } from "../weapons/usables/usables";
import { WEAPONS } from "../weapons/weapons";
import { ARENA_ITEMS, Loadout, startingSlots } from "./loadout";
import "./arena.css";

// The controls the test scenes' setup panels are made of (the arena's and the
// boss test scene's), and the sections for the player's loadout. Panels edit
// a draft in place and are drawn every frame, so a change shows right away.

const ITEM_GROUPS: [string, Item["category"]][] = [
  ["Equipment", "equipment"],
  ["Attachments", "attachment"],
  ["Boss items", "boss"],
];

/** The player's character, weapons, throwable and usable, and items, edited in `draft` */
export function LoadoutSections({ draft }: { draft: Loadout }) {
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
    <>
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
                  <option value={WEAPONS.indexOf(weapon)}>{weapon.name}</option>
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
    </>
  );
}

export function Section({
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

export function Row({
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
export function Stepper({
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

export function Choices<T extends string | number>({
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

export function Toggle({
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

import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import { makeRandom } from "../../core/util/Random";
import {
  BodyLook,
  Build,
  DEFAULT_LOOK,
  EXTRA_KINDS,
  GLASSES_SHAPES,
  HAT_STYLES,
  Hair,
  PATTERN_KINDS,
  TOP_STYLES,
  Zombification,
} from "../../highrise/looks/BodyLook";
import { composeBodySvg, svgDataUrl } from "../../highrise/looks/composeBody";
import { BODY_PARTS, drawBody } from "../../highrise/looks/drawBody";
import { randomLook } from "../../highrise/looks/randomLook";
import { pieceNames, piecePlace } from "../../highrise/looks/pieces";

/** How long after the last change a look is saved */
const SAVE_DELAY = 500;
/** Changes closer together than this are one step of undo */
const UNDO_GROUP = 800;

const BUILD_LABELS: Record<keyof Build, [string, string, string]> = {
  shoulders: ["Shoulders", "narrow", "broad"],
  chest: ["Chest", "flat", "deep"],
  belly: ["Belly", "none", "big"],
  hunch: ["Hunch", "upright", "hunched"],
  squareness: ["Shoulder shape", "round", "square"],
  arms: ["Arms", "thin", "thick"],
  hands: ["Hands", "small", "big"],
  head: ["Head", "small", "big"],
};

const HAIR_SLIDERS: [keyof Hair, string, string][] = [
  ["coverage", "Coverage", "How far forward it comes; 0 is bald"],
  ["volume", "Volume", "How much it stands out from the head"],
  ["messiness", "Messiness", "How uneven its edge is"],
  ["curls", "Curls", "Bumps round the edge, up to an afro"],
  ["length", "Length", "How far it hangs down the back"],
  ["bun", "Bun", ""],
  ["ponytail", "Ponytail", ""],
  ["mohawk", "Mohawk", "Shaved but for a strip this wide"],
];

const ZOMBIE_PREVIEW: Zombification = { rot: 0.8, blood: 0.6, tears: 0.6 };

/**
 * Everything about how a character looks, with a live preview drawn by the
 * same generator as the game. Changes save themselves a moment after the
 * last one; Undo (or ⌘Z) steps back.
 */
export function AppearanceTab({
  look,
  onChange,
  onSave,
}: {
  look: BodyLook;
  onChange: (look: BodyLook) => void;
  onSave: (look: BodyLook) => void;
}) {
  const [zombify, setZombify] = useState(false);
  const [zombie, setZombie] = useState(ZOMBIE_PREVIEW);
  const history = useRef<BodyLook[]>([]);
  const lastChange = useRef(0);
  const saveTimer = useRef<number>();

  const commit = (next: BodyLook, fromUndo = false) => {
    const now = performance.now();
    if (!fromUndo && now - lastChange.current > UNDO_GROUP) {
      history.current.push(look);
    }
    lastChange.current = fromUndo ? 0 : now;
    onChange(next);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => onSave(next), SAVE_DELAY);
  };
  const undo = () => {
    const previous = history.current.pop();
    if (previous) {
      commit(previous, true);
    }
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "z" &&
        !event.shiftKey &&
        target.tagName !== "TEXTAREA" &&
        target.getAttribute("type") !== "text"
      ) {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const set = <K extends keyof BodyLook>(key: K, value: BodyLook[K]) =>
    commit({ ...look, [key]: value });

  const preview = zombify ? { ...look, zombie } : look;

  return (
    <div class="appearance">
      <Preview look={preview} />

      <div class="appearance__controls">
        <section class="card appearance__tools">
          <button onClick={undo} disabled={history.current.length === 0}>
            Undo
          </button>
          <button
            title="A random look; Undo brings this one back"
            onClick={() =>
              commit({
                ...randomLook(makeRandom(Date.now()), false),
                seed: look.seed,
              })
            }
          >
            Random look
          </button>
          <button
            title="The random parts: ragged edges, where rips and blood go"
            onClick={() => set("seed", Math.floor(Math.random() * 1e6))}
          >
            New seed
          </button>
          <label class="appearance__zombify">
            <input
              type="checkbox"
              checked={zombify}
              onChange={(e) =>
                setZombify((e.target as HTMLInputElement).checked)
              }
            />
            Preview as a zombie
          </label>
          {zombify && (
            <div class="appearance__zombie">
              {(["rot", "blood", "tears"] as const).map((key) => (
                <Slider
                  key={key}
                  label={key[0].toUpperCase() + key.slice(1)}
                  value={zombie[key]}
                  min={0}
                  max={1}
                  onChange={(value) => setZombie({ ...zombie, [key]: value })}
                />
              ))}
            </div>
          )}
        </section>

        <section class="card">
          <h2>Body</h2>
          <ColorField
            label="Skin"
            value={look.skin}
            onChange={(v) => set("skin", v)}
          />
          {(Object.keys(BUILD_LABELS) as (keyof Build)[]).map((key) => {
            const [label, low, high] = BUILD_LABELS[key];
            return (
              <Slider
                key={key}
                label={label}
                hint={`${low} – ${high}`}
                value={look.build[key]}
                min={-1}
                max={1}
                reset={0}
                onChange={(value) =>
                  set("build", { ...look.build, [key]: value })
                }
              />
            );
          })}
        </section>

        <section class="card">
          <h2>Hair</h2>
          <ColorField
            label="Color"
            value={look.hair.color}
            onChange={(color) => set("hair", { ...look.hair, color })}
          />
          {HAIR_SLIDERS.map(([key, label, hint]) => (
            <Slider
              key={key}
              label={label}
              hint={hint}
              value={look.hair[key] as number}
              min={0}
              max={1}
              reset={DEFAULT_LOOK.hair[key] as number}
              onChange={(value) => set("hair", { ...look.hair, [key]: value })}
            />
          ))}
          <Slider
            label="Hairline"
            hint="forward in the middle – receding"
            value={look.hair.fringe}
            min={-1}
            max={1}
            reset={DEFAULT_LOOK.hair.fringe}
            onChange={(fringe) => set("hair", { ...look.hair, fringe })}
          />
          <Optional
            label="Parting"
            on={look.hair.part !== undefined}
            onToggle={(on) =>
              set("hair", { ...look.hair, part: on ? -0.4 : undefined })
            }
          >
            <Slider
              label="Where"
              hint="left – right"
              value={look.hair.part ?? 0}
              min={-1}
              max={1}
              onChange={(part) => set("hair", { ...look.hair, part })}
            />
          </Optional>
          <Optional
            label="Beard"
            on={!!look.beard}
            onToggle={(on) => set("beard", on ? { length: 0.3 } : undefined)}
          >
            {look.beard && (
              <>
                <Slider
                  label="Length"
                  value={look.beard.length}
                  min={0}
                  max={1}
                  onChange={(length) =>
                    set("beard", { ...look.beard!, length })
                  }
                />
                <OptionalColor
                  label="Own color"
                  value={look.beard.color}
                  fallback={look.hair.color}
                  onChange={(color) => set("beard", { ...look.beard!, color })}
                />
              </>
            )}
          </Optional>
        </section>

        <section class="card">
          <h2>Clothes</h2>
          <SelectField
            label="Top"
            value={look.top.style}
            options={TOP_STYLES}
            onChange={(style) => style && set("top", { ...look.top, style })}
          />
          <ColorField
            label="Color"
            value={look.top.color}
            onChange={(color) => set("top", { ...look.top, color })}
          />
          <ColorField
            label="Secondary"
            hint="The shirt under a jacket, vest or overalls; a coat's trim"
            value={look.top.secondary}
            onChange={(secondary) => set("top", { ...look.top, secondary })}
          />
          <Optional
            label="Pattern"
            on={!!look.top.pattern}
            onToggle={(on) =>
              set("top", {
                ...look.top,
                pattern: on ? { kind: "stripes", color: "#ffffff" } : undefined,
              })
            }
          >
            {look.top.pattern && (
              <>
                <SelectField
                  label="Kind"
                  value={look.top.pattern.kind}
                  options={PATTERN_KINDS}
                  onChange={(kind) =>
                    kind &&
                    set("top", {
                      ...look.top,
                      pattern: { ...look.top.pattern!, kind },
                    })
                  }
                />
                <ColorField
                  label="Color"
                  value={look.top.pattern.color}
                  onChange={(color) =>
                    set("top", {
                      ...look.top,
                      pattern: { ...look.top.pattern!, color },
                    })
                  }
                />
              </>
            )}
          </Optional>
          <Slider
            label="Sleeves"
            hint="none – to the wrist"
            value={look.sleeves.length}
            min={0}
            max={1}
            onChange={(length) => set("sleeves", { ...look.sleeves, length })}
          />
          <OptionalColor
            label="Own sleeve color"
            value={look.sleeves.color}
            fallback={look.top.color}
            onChange={(color) => set("sleeves", { ...look.sleeves, color })}
          />
          <OptionalColor
            label="Cuffs"
            value={look.sleeves.cuff}
            fallback="#ffffff"
            onChange={(cuff) => set("sleeves", { ...look.sleeves, cuff })}
          />
          <OptionalColor
            label="Gloves"
            value={look.gloves}
            fallback="#2a2a2a"
            onChange={(gloves) => set("gloves", gloves)}
          />
          <ColorField
            label="Trousers"
            value={look.pants}
            onChange={(v) => set("pants", v)}
          />
          <ColorField
            label="Shoes"
            value={look.shoes}
            onChange={(v) => set("shoes", v)}
          />
        </section>

        <section class="card">
          <h2>Things</h2>
          <SelectField
            label="Hat"
            value={look.hat?.style ?? ""}
            options={HAT_STYLES}
            none="No hat"
            onChange={(style) =>
              set(
                "hat",
                style ? { color: "#3a3a3a", ...look.hat, style } : undefined,
              )
            }
          />
          {look.hat && (
            <>
              <ColorField
                label="Hat color"
                value={look.hat.color}
                onChange={(color) => set("hat", { ...look.hat!, color })}
              />
              <OptionalColor
                label="Trim"
                value={look.hat.secondary}
                fallback="#ffffff"
                onChange={(secondary) =>
                  set("hat", { ...look.hat!, secondary })
                }
              />
            </>
          )}
          <SelectField
            label="Glasses"
            value={look.glasses?.shape ?? ""}
            options={GLASSES_SHAPES}
            none="No glasses"
            onChange={(shape) =>
              set(
                "glasses",
                shape
                  ? { color: "#1a1a1a", ...look.glasses, shape }
                  : undefined,
              )
            }
          />
          {look.glasses && (
            <ColorField
              label="Frames"
              value={look.glasses.color}
              onChange={(color) => set("glasses", { ...look.glasses!, color })}
            />
          )}
          <h3 class="appearance__subhead">Pieces (hand-drawn)</h3>
          {pieceNames().length === 0 && (
            <p class="muted small">None yet: see looks/pieces/README.md</p>
          )}
          {pieceNames().map((name) => {
            const piece = look.pieces?.find((p) => p.name === name);
            const others = (look.pieces ?? []).filter((p) => p.name !== name);
            const setPiece = (next: typeof piece) =>
              set(
                "pieces",
                next ? [...others, next] : others.length ? others : undefined,
              );
            return (
              <div key={name}>
                <OptionalColor
                  label={`${name} (${piecePlace(name)})`}
                  value={piece?.color}
                  fallback="#3a3a3a"
                  onChange={(color) =>
                    setPiece(color ? { ...piece, name, color } : undefined)
                  }
                />
                {piece && (
                  <OptionalColor
                    label="Secondary"
                    value={piece.secondary}
                    fallback="#cccccc"
                    onChange={(secondary) => setPiece({ ...piece, secondary })}
                  />
                )}
              </div>
            );
          })}
          <h3 class="appearance__subhead">Worn or carried</h3>
          {EXTRA_KINDS.map((kind) => {
            const extra = look.extras.find((e) => e.kind === kind);
            return (
              <OptionalColor
                key={kind}
                label={kind[0].toUpperCase() + kind.slice(1)}
                value={extra?.color}
                fallback="#6b4428"
                onChange={(color) =>
                  set(
                    "extras",
                    color
                      ? extra
                        ? look.extras.map((e) =>
                            e.kind === kind ? { kind, color } : e,
                          )
                        : [...look.extras, { kind, color }]
                      : look.extras.filter((e) => e.kind !== kind),
                  )
                }
              />
            );
          })}
        </section>
      </div>
    </div>
  );
}

/** The body standing and lying, and each part on its own */
function Preview({ look }: { look: BodyLook }) {
  const images = useMemo(() => {
    const body = drawBody(look, "preview");
    return {
      standing: svgDataUrl(composeBodySvg(look, { scale: 420 }, "ps")),
      lying: svgDataUrl(
        composeBodySvg(look, { scale: 220, pose: "lying" }, "pl"),
      ),
      parts: BODY_PARTS.map((part) => ({
        part,
        url: svgDataUrl(body.parts[part].toSvg(160)),
      })),
    };
  }, [JSON.stringify(look)]);
  return (
    <div class="appearance__preview">
      <div class="appearance__stage">
        <img src={images.standing} />
      </div>
      <div class="appearance__stage appearance__stage--small">
        <img src={images.lying} />
      </div>
      <div class="appearance__parts">
        {images.parts.map(({ part, url }) => (
          <figure key={part}>
            <img src={url} />
            <figcaption>{part}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ComponentChildren;
}) {
  return (
    <label class="field" title={hint}>
      <span class="field__label">
        {label}
        {hint && <span class="field__hint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** A number from `min` to `max`; double-click puts it back to `reset` */
function Slider({
  label,
  hint,
  value,
  min,
  max,
  reset,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  reset?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <span class="slider">
        <input
          type="range"
          min={min}
          max={max}
          step={0.01}
          value={value}
          onInput={(e) =>
            onChange(Number((e.target as HTMLInputElement).value))
          }
          onDblClick={() => reset !== undefined && onChange(reset)}
        />
        <span class="slider__value">{value.toFixed(2)}</span>
      </span>
    </Field>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <span class="color">
        <input
          type="color"
          value={value}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        />
        <span class="color__value">{value}</span>
      </span>
    </Field>
  );
}

/** A color that can be left out (gloves, cuffs, a hat's trim) */
function OptionalColor({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (color: string | undefined) => void;
}) {
  return (
    <Field label={label}>
      <span class="color">
        <input
          type="checkbox"
          checked={value !== undefined}
          onChange={(e) =>
            onChange(
              (e.target as HTMLInputElement).checked ? fallback : undefined,
            )
          }
        />
        {value !== undefined && (
          <>
            <input
              type="color"
              value={value}
              onInput={(e) => onChange((e.target as HTMLInputElement).value)}
            />
            <span class="color__value">{value}</span>
          </>
        )}
      </span>
    </Field>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  none,
  onChange,
}: {
  label: string;
  value: T | "";
  options: readonly T[];
  /** Offers nothing at all, as this */
  none?: string;
  onChange: (value: T | "") => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value as T)}
      >
        {none && <option value="">{none}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** A group of settings that's only there when it's turned on */
function Optional({
  label,
  on,
  onToggle,
  children,
}: {
  label: string;
  on: boolean;
  onToggle: (on: boolean) => void;
  children: ComponentChildren;
}) {
  return (
    <div class={`optional ${on ? "is-on" : ""}`}>
      <label class="optional__toggle">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onToggle((e.target as HTMLInputElement).checked)}
        />
        {label}
      </label>
      {on && <div class="optional__body">{children}</div>}
    </div>
  );
}

import { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import { BodyLook } from "../../highrise/looks/BodyLook";
import { ThumbnailKind, thumbnailUrl } from "./thumbnails";
import { tip } from "./tooltips";

/*
 * The Appearance tab's controls: a labelled row, sliders, colors, switches,
 * segmented buttons and pictures to pick from. Explanations are tooltips on
 * the labels (`tip`), so the rows stay one line.
 */

/** A titled box of settings that belong together */
export function Group({
  title,
  tip: about,
  wide,
  children,
}: {
  title: string;
  tip?: string;
  /** Across the whole section, for long rows of pictures */
  wide?: boolean;
  children: ComponentChildren;
}) {
  return (
    <section class={`group ${wide ? "group--wide" : ""}`}>
      <h3 class="group__title" {...tip(about)}>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** A setting's row: its label (explained in a tooltip) and its control */
export function Field({
  label,
  tip: about,
  children,
}: {
  label: string;
  tip?: string;
  children: ComponentChildren;
}) {
  return (
    <div class="field">
      <span class={`field__label ${about ? "has-tip" : ""}`} {...tip(about)}>
        {label}
      </span>
      <div class="field__control">{children}</div>
    </div>
  );
}

/**
 * A number from `min` to `max`, filled from the middle when it goes both
 * ways (from average), else from the start, with what each end means under
 * it. ↺ (or a double-click) puts it back to `reset`.
 */
export function Slider({
  label,
  tip: about,
  value,
  min = 0,
  max = 1,
  reset,
  ends,
  resetTip,
  onChange,
}: {
  label: string;
  tip?: string;
  value: number;
  min?: number;
  max?: number;
  reset?: number;
  /** What the left and right ends mean */
  ends?: [string, string];
  /** What ↺ says it does, if not "Back to average" or "Back to the default" */
  resetTip?: string;
  onChange: (value: number) => void;
}) {
  const t = (value - min) / (max - min);
  const from = min < 0 ? -min / (max - min) : 0;
  const changed = reset !== undefined && Math.abs(value - reset) > 0.001;
  return (
    <Field label={label} tip={about}>
      <div class="slider">
        <div class="slider__track">
          <input
            type="range"
            class={`range ${min < 0 ? "range--centered" : ""}`}
            min={min}
            max={max}
            step={0.01}
            value={value}
            style={{
              "--from": Math.min(from, t),
              "--to": Math.max(from, t),
            }}
            onInput={(e) =>
              onChange(Number((e.target as HTMLInputElement).value))
            }
            onDblClick={() => reset !== undefined && onChange(reset)}
          />
          {ends && (
            <div class="slider__ends">
              <span>{ends[0]}</span>
              <span>{ends[1]}</span>
            </div>
          )}
        </div>
        <span class="slider__value">{value.toFixed(2)}</span>
        <button
          type="button"
          class={`slider__reset ${changed ? "" : "is-hidden"}`}
          tabIndex={changed ? 0 : -1}
          {...tip(
            resetTip ??
              (min < 0 && reset === 0
                ? "Back to average"
                : "Back to the default"),
          )}
          onClick={() => reset !== undefined && onChange(reset)}
        >
          ↺
        </button>
      </div>
    </Field>
  );
}

/** A color swatch that opens the color picker; its hex in the tooltip */
export function Swatch({
  value,
  label,
  faded,
  any,
  onChange,
}: {
  value: string;
  label: string;
  /** Showing a color that's another's (the hair's, say), not its own */
  faded?: boolean;
  /** Beside presets, for any other color: a rainbow until it has one */
  any?: boolean;
  onChange: (color: string) => void;
}) {
  return (
    <label
      class={`swatch ${faded ? "is-faded" : ""} ${any ? "swatch--any" : ""}`}
      style={{ "--color": value }}
      {...tip(
        any
          ? "Pick a color of your own"
          : faded
            ? `${value}: pick one of its own`
            : value,
        label,
      )}
    >
      <input
        type="color"
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
      />
    </label>
  );
}

/** A named color to pick with one click */
export interface Preset {
  color: string;
  name?: string;
}

/**
 * A color: picked from `presets` (skin tones, hair colors), or any color.
 * With `inherit`, it can also be left to follow another (brows the hair,
 * sleeves the top), which is what leaving it out of the look means.
 */
export function ColorField({
  label,
  tip: about,
  value,
  presets,
  inherit,
  onChange,
}: {
  label: string;
  tip?: string;
  value: string | undefined;
  presets?: Preset[];
  /** What it follows when it's left out ("Same as hair"), and its color */
  inherit?: { label: string; color: string };
  onChange: (color: string | undefined) => void;
}) {
  const shown = value ?? inherit?.color ?? "#000000";
  const isPreset = presets?.some((p) => same(p.color, value));
  return (
    <Field label={label} tip={about}>
      <div class="colors">
        {presets?.map((preset) => (
          <button
            key={preset.color}
            class={`preset ${same(preset.color, value) ? "is-selected" : ""}`}
            style={{ "--color": preset.color }}
            {...tip(preset.color, preset.name)}
            onClick={() => onChange(preset.color)}
          />
        ))}
        <span
          class={`colors__own ${presets && !isPreset && value ? "is-selected" : ""}`}
        >
          <Swatch
            value={shown}
            label={presets ? "Any color" : label}
            faded={value === undefined}
            any={presets && (isPreset || !value)}
            onChange={onChange}
          />
        </span>
        {inherit &&
          (value === undefined ? (
            <span class="colors__inherit is-on">{inherit.label}</span>
          ) : (
            <button
              class="text-button colors__inherit"
              {...tip("Goes back to following it")}
              onClick={() => onChange(undefined)}
            >
              {inherit.label}
            </button>
          ))}
      </div>
    </Field>
  );
}

function same(a: string | undefined, b: string | undefined) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/** On or off, with whatever goes with it (a color) beside it when it's on */
export function Toggle({
  label,
  tip: about,
  on,
  onChange,
  children,
}: {
  label: string;
  tip?: string;
  on: boolean;
  onChange: (on: boolean) => void;
  children?: ComponentChildren;
}) {
  return (
    <Field label={label} tip={about}>
      <div class="toggle">
        <label class="switch">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
          />
          <span />
        </label>
        {on && children}
      </div>
    </Field>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
  tip?: string;
  /** Can't be picked (and the tooltip says why) */
  disabled?: boolean;
}

/** One of a few, as a row of buttons */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div class="segmented">
      {options.map((option) => (
        // Not `disabled`, which would stop the tooltip saying why
        <button
          key={option.value}
          class={`${option.value === value ? "is-selected" : ""} ${option.disabled ? "is-disabled" : ""}`}
          aria-disabled={option.disabled}
          {...tip(option.tip)}
          onClick={() => !option.disabled && onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** `value`, but only once it's stopped changing for `ms` */
function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  const key = JSON.stringify(value);
  useEffect(() => {
    const timeout = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timeout);
  }, [key]);
  return settled;
}

/**
 * Pictures of the character with each option, to pick one (or, with
 * `multiple`, any number) by how it looks rather than its name. Drawn from
 * the look as it is, a moment after it stops changing.
 */
export function Picker<T extends string>({
  look,
  kind,
  options,
  selected,
  vary,
  multiple,
  onPick,
}: {
  look: BodyLook;
  /** What the pictures show, or for each option */
  kind: ThumbnailKind | ((value: T) => ThumbnailKind);
  options: Option<T>[];
  selected: (value: T) => boolean;
  /** The look with this option */
  vary: (look: BodyLook, value: T) => BodyLook;
  multiple?: boolean;
  onPick: (value: T) => void;
}) {
  const settled = useSettled(look, 200);
  return (
    <div class={`picker picker--${typeof kind === "string" ? kind : "mixed"}`}>
      {options.map((option) => {
        const on = selected(option.value);
        return (
          <button
            key={option.value}
            class={`picker__option ${on ? "is-selected" : ""} ${multiple ? "is-multiple" : ""}`}
            aria-pressed={on}
            {...tip(option.tip, option.tip ? option.label : undefined)}
            onClick={() => onPick(option.value)}
          >
            <img
              src={thumbnailUrl(
                vary(settled, option.value),
                typeof kind === "string" ? kind : kind(option.value),
              )}
              alt=""
            />
            <span class="picker__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

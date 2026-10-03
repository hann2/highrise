import AutoPauser from "../../core/AutoPauser";
import { desktop } from "../../core/desktop";
import type Game from "../../core/Game";
import { StatsOverlay } from "../../core/util/stats-overlay/StatsOverlay";
import { loadSaveData, updateSaveData } from "../persistence/SaveData";

/**
 * The player's settings, as data: each one's tab, label, description, the
 * values it can take, and how to apply it. The settings screen
 * (`menu/SettingsScreen`) draws itself from this list, and `SettingsController`
 * keeps the values. A setting either applies itself here (`apply`), or the
 * system it belongs to reads it with `getSetting` when it's made and listens
 * for `settingChanged` (the volumes, in `VolumeController`).
 *
 * Values are kept in `SaveData.settings`, read tolerantly: anything missing or
 * not one of a setting's values is its default.
 */

export type SettingValue = string | number | boolean;

export const SETTINGS_TABS = ["Display", "Graphics", "Audio", "Game"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

export interface SettingOption<T extends SettingValue> {
  value: T;
  label: string;
}

export interface SettingDefinition<T extends SettingValue> {
  tab: SettingsTab;
  label: string;
  /** What it does, shown under the list when it's selected */
  description: string;
  /** What it costs, for the ones that trade looks for speed */
  cost?: string;
  /** When a change shows, if not right away */
  takesEffect?: "restart" | "nextFloor";
  default: T;
  /** The values it can take, in order. Labels can depend on the game (Auto's) */
  options(game?: Game): SettingOption<T>[];
  /** Whether a stored value is one it can take; else the value must be one of `options()` */
  isValid?(value: unknown): value is T;
  /** Drawn as a bar of steps (volumes) instead of a label */
  bar?: boolean;
  /** Whether it's offered at all here (fullscreen is only in the desktop app) */
  available?(): boolean;
  /** Makes it so. Called when it changes, and for every setting at startup */
  apply?(game: Game, value: T): void;
  /** Not kept in the save, but read back from wherever it lives */
  read?(): T;
}

function setting<const T extends SettingValue>(
  definition: SettingDefinition<T>,
): SettingDefinition<T> {
  return definition;
}

const ON_OFF = [
  { value: true, label: "On" },
  { value: false, label: "Off" },
];

function labeled<T extends SettingValue>(
  pairs: [T, string][],
): SettingOption<T>[] {
  return pairs.map(([value, label]) => ({ value, label }));
}

/** 0 to 100% in tenths */
const VOLUME_STEPS = Array.from({ length: 11 }, (_, i) => ({
  value: i / 10,
  label: `${i * 10}%`,
}));

/** Frame rate limits to offer, below the display's rate (a limit above it does nothing) */
const FRAME_RATE_LIMITS = [30, 60, 90, 120, 144, 165, 240];

/**
 * Where the costs in the descriptions were measured: the fire benchmark
 * (`npm run benchmark:fire` with `FIRES=32 DPR=2 SETTINGS=...`), a lot of
 * fire in the dark, at 6 ms a frame with the defaults on Simon's Mac.
 * Measured 2026-10-02, to a few tenths of a millisecond.
 */
const IN_THE_BENCHMARK = "with 32 pools of fire on a retina display";

/** The display's pixels per logical pixel, which a render scale of 100% renders at */
export const MAX_RESOLUTION =
  typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

export const SETTINGS = {
  // Display
  renderScale: setting({
    tab: "Display",
    label: "Render Scale",
    description:
      "How many of the display's pixels the game draws. Lower is blurrier, " +
      "and much less work for the graphics card.",
    cost: `The biggest one: what every pixel costs, times the number of pixels. 50% took a frame from 6 ms to 2.8 ${IN_THE_BENCHMARK}.`,
    default: 1,
    options: () =>
      [0.5, 0.6, 0.75, 0.9, 1].map((value) => ({
        value,
        label: `${Math.round(value * 100)}%`,
      })),
    apply: (game, value) => game.renderer.setResolution(MAX_RESOLUTION * value),
  }),
  antialias: setting({
    tab: "Display",
    label: "Antialiasing",
    description:
      "Smooths the jagged edges of shapes. Auto turns it on unless the " +
      "display has two or more pixels per point, where edges are smooth " +
      "enough without it.",
    cost: "A few tenths of a millisecond a frame on a high-resolution display.",
    takesEffect: "restart",
    default: "auto" as AntialiasChoice,
    options: (): SettingOption<AntialiasChoice>[] => [
      { value: "auto", label: `Auto (${antialiasFor("auto") ? "On" : "Off"})` },
      { value: "on", label: "On" },
      { value: "off", label: "Off" },
    ],
  }),
  frameRateLimit: setting({
    tab: "Display",
    label: "Frame Rate Limit",
    description:
      "The most frames a second the game draws. Auto is the display's " +
      "refresh rate. A lower limit helps a machine that can't keep up with " +
      "a fast display.",
    default: 0,
    options: (game) => [
      { value: 0, label: `Auto${game ? ` (${game.refreshRate})` : ""}` },
      ...FRAME_RATE_LIMITS.filter(
        (rate) => !game || rate < game.refreshRate,
      ).map((rate) => ({ value: rate, label: `${rate}` })),
    ],
    isValid: (value): value is number =>
      typeof value === "number" && Number.isInteger(value) && value >= 0,
    apply: (game, value) => {
      game.frameRateLimit = value > 0 ? value : undefined;
    },
  }),
  fullscreen: setting({
    tab: "Display",
    label: "Fullscreen",
    description: "Fills the screen, or plays in a window.",
    default: true,
    options: () => ON_OFF,
    available: () => desktop !== undefined,
    read: () => desktop?.isFullscreen() ?? false,
    apply: (_game, value) => {
      if (desktop && desktop.isFullscreen() !== value) {
        desktop.setFullscreen(value);
      }
    },
  }),
  showFps: setting({
    tab: "Display",
    label: "Show FPS",
    description:
      "Frames per second in the corner. Backslash also cycles through the " +
      "more detailed panels.",
    default: false,
    options: () => ON_OFF,
    apply: (game, value) => {
      const overlay = game.entities.getByConstructor(StatsOverlay)[0];
      // Off only closes the FPS counter, not a panel opened with Backslash
      if (value) {
        overlay?.showPanel("fps");
      } else if (overlay?.activePanel?.id === "fps") {
        overlay.showPanel(undefined);
      }
    },
  }),

  // Graphics
  lightingDetail: setting({
    tab: "Graphics",
    label: "Lighting Detail",
    description:
      "How sharply lights and shadows are drawn, in pixels per meter. Lower " +
      "makes shadow edges blurrier and blockier.",
    cost: `Grows with the number of lights in view. Low saved about 0.5 ms a frame and Ultra added 1 to 2, ${IN_THE_BENCHMARK}.`,
    default: 32,
    options: () =>
      labeled([
        [16, "Low (16)"],
        [24, "Medium (24)"],
        [32, "High (32)"],
        [48, "Ultra (48)"],
      ]),
  }),
  movingLightShadows: setting({
    tab: "Graphics",
    label: "Moving Light Shadows",
    description:
      "Shadows from lights that move or flicker: fire, burning things, " +
      "sparks, the flashlight. Off, their light goes through walls.",
    cost: `Grows with the walls near each light. Off saved about 0.6 ms a frame ${IN_THE_BENCHMARK}.`,
    default: true,
    options: () => ON_OFF,
  }),
  fireLights: setting({
    tab: "Graphics",
    label: "Fire Lights",
    description:
      "How many lights a fire on the floor has: one for every half-meter " +
      "square that's burning, or one for every few. Fewer lights flicker " +
      "less, and light the fire less like the shape it is.",
    cost: `Only with fire in view. Reduced (one light per 2 × 2 squares) saved about 0.7 ms a frame and Minimal (4 × 4) about 1.2, ${IN_THE_BENCHMARK}.`,
    default: 1,
    options: () =>
      labeled([
        [1, "Full"],
        [2, "Reduced"],
        [4, "Minimal"],
      ]),
  }),
  flameDetail: setting({
    tab: "Graphics",
    label: "Flame & Smoke Detail",
    description:
      "Layers of swirling detail in flames and smoke. Fewer looks smoother " +
      "and blurrier.",
    cost: `Every pixel of flame and smoke, so it grows with the render scale. Low saved about 1.5 ms a frame, the most of any graphics setting, ${IN_THE_BENCHMARK}.`,
    default: 4,
    options: () =>
      labeled([
        [2, "Low"],
        [3, "Medium"],
        [4, "High"],
      ]),
  }),
  flameResolution: setting({
    tab: "Graphics",
    label: "Flame Resolution",
    description:
      "How finely the shape of the flames is worked out, in pixels per " +
      "meter. Lower makes flames blobbier.",
    cost: `Small: Low made no difference that could be measured ${IN_THE_BENCHMARK}.`,
    default: 16,
    options: () =>
      labeled([
        [8, "Low (8)"],
        [12, "Medium (12)"],
        [16, "High (16)"],
        [24, "Ultra (24)"],
      ]),
  }),
  embers: setting({
    tab: "Graphics",
    label: "Embers",
    description: "The sparks that fly up off fire.",
    cost: `Only with fire in view. Off saved about 1 ms a frame ${IN_THE_BENCHMARK}.`,
    default: 1,
    options: () =>
      labeled([
        [1, "Full"],
        [0.5, "Half"],
        [0, "Off"],
      ]),
  }),
  fogDetail: setting({
    tab: "Graphics",
    label: "Fog of War Detail",
    description:
      "How sharply the edge of what you can see is drawn, in pixels per " +
      "meter. Lower makes it blurrier.",
    cost: `Small: Low made no difference that could be measured ${IN_THE_BENCHMARK}.`,
    default: 48,
    options: () =>
      labeled([
        [24, "Low (24)"],
        [32, "Medium (32)"],
        [48, "High (48)"],
        [64, "Ultra (64)"],
      ]),
  }),
  gunfireLights: setting({
    tab: "Graphics",
    label: "Gunfire Lights",
    description:
      "The flash of light from each shot, and the glow of bullets in the dark.",
    cost: "Small: a light per shot and per bullet in flight. Not measured.",
    default: true,
    options: () => ON_OFF,
  }),

  // Audio
  masterVolume: setting({
    tab: "Audio",
    label: "Volume",
    description: "How loud everything is.",
    default: 1,
    options: () => VOLUME_STEPS,
    bar: true,
  }),
  musicVolume: setting({
    tab: "Audio",
    label: "Music",
    description: "How loud the music is.",
    default: 1,
    options: () => VOLUME_STEPS,
    bar: true,
  }),
  effectsVolume: setting({
    tab: "Audio",
    label: "Sound Effects",
    description: "How loud everything but the music is: guns, zombies, voices.",
    default: 1,
    options: () => VOLUME_STEPS,
    bar: true,
  }),
  muted: setting({
    tab: "Audio",
    label: "Mute",
    description: "Silences everything. M toggles it any time.",
    default: false,
    options: () => ON_OFF,
  }),

  // Game
  damageEffect: setting({
    tab: "Game",
    label: "Damage Effect",
    description:
      "How strongly the screen flashes red when you're hurt (and green when " +
      "you're healed), and greys out as your health runs low.",
    cost:
      "The greying out is a pass over the whole screen, a few tenths of a " +
      "millisecond on a retina display, but only below two thirds of your " +
      "health, and not at all when Off.",
    default: 1,
    options: () =>
      labeled([
        [1, "Full"],
        [0.5, "Reduced"],
        [0, "Off"],
      ]),
  }),
  screenShake: setting({
    tab: "Game",
    label: "Screen Shake",
    description: "How much the view shakes, like in the lobby's elevator.",
    default: 1,
    options: () =>
      labeled([
        [1, "Full"],
        [0.5, "Half"],
        [0, "Off"],
      ]),
  }),
  autoPause: setting({
    tab: "Game",
    label: "Auto-Pause",
    description: "Pauses the game when its window or tab is in the background.",
    default: true,
    options: () => ON_OFF,
    apply: (game, value) => {
      const autoPauser = game.entities.getByConstructor(AutoPauser)[0];
      if (autoPauser) {
        autoPauser.enabled = value;
      }
    },
  }),
};

export type Settings = typeof SETTINGS;
export type SettingId = keyof Settings;
export type ValueOf<K extends SettingId> = Settings[K]["default"];
export type SettingValues = { [K in SettingId]: ValueOf<K> };

export const SETTING_IDS = Object.keys(SETTINGS) as SettingId[];

export function getDefinition<K extends SettingId>(
  id: K,
): SettingDefinition<ValueOf<K>> {
  return SETTINGS[id] as unknown as SettingDefinition<ValueOf<K>>;
}

export function isValidValue(id: SettingId, value: unknown): boolean {
  const definition = getDefinition(id);
  if (definition.isValid) {
    return definition.isValid(value);
  }
  return definition.options().some((option) => option.value === value);
}

/** The settings from the save, with defaults for anything missing or wrong */
export function loadSettings(): SettingValues {
  const stored = { ...legacySettings(), ...loadSaveData().settings };
  const values: Record<string, SettingValue> = {};
  for (const id of SETTING_IDS) {
    const value = stored[id];
    values[id] = isValidValue(id, value)
      ? (value as SettingValue)
      : SETTINGS[id].default;
  }
  return values as SettingValues;
}

/** Keeps one setting in the save */
export function saveSetting<K extends SettingId>(id: K, value: ValueOf<K>) {
  updateSaveData((data) => {
    data.settings[id] = value;
  });
}

/**
 * Settings from before there were settings, kept in their own localStorage
 * keys: the graphics quality (Low was half resolution), mute and volume
 */
function legacySettings(): Record<string, unknown> {
  const legacy: Record<string, unknown> = {};
  try {
    if (localStorage.getItem("graphicsQuality") === "Low") {
      legacy.renderScale = 0.5;
    }
    const muted = localStorage.getItem("muted");
    if (muted != null) {
      legacy.muted = muted === "true";
    }
    const volume = parseFloat(localStorage.getItem("volume") ?? "");
    if (volume >= 0 && volume <= 1) {
      legacy.masterVolume = Math.round(volume * 10) / 10;
    }
  } catch {
    // Storage can be disabled
  }
  return legacy;
}

export type AntialiasChoice = "auto" | "on" | "off";

/** Whether the canvas should be antialiased for the `antialias` setting on this display */
export function antialiasFor(choice: AntialiasChoice): boolean {
  if (choice === "auto") {
    return (MAX_RESOLUTION || 1) < 2;
  }
  return choice === "on";
}

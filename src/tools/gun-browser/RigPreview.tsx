import { useEffect, useRef, useState } from "preact/hooks";
import { CHARACTERS } from "../../highrise/characters/Character";
import type { RigMode } from "../../highrise/rig/RigTestScene";
import {
  RigCommand,
  RigShow,
  RigStatus,
  RigView,
} from "../../highrise/rig/rigMessages";
import { GunAnimations, GunStats } from "../../highrise/weapons/guns/GunStats";
import { Segmented } from "../shared/Segmented";

/*
 * The guns in someone's hands, in the game itself: the rig scene
 * (`?scene=rig&embed`) in an iframe, driven by `RigShow`s and sending back
 * where the first gun's animation is. The iframe never takes the focus or
 * the mouse, so the page's keys keep working.
 */

export const MODE_LABELS: Record<RigMode, [string, string]> = {
  demo: ["Demo", "Shooting a little, then reloading, over and over"],
  reload: ["Reload", "The magazine reload, over and over"],
  reloadEmpty: ["From empty", "The reload from empty, over and over"],
  reloadStart: ["Start", "Starting a round-at-a-time reload"],
  reloadInsert: ["Insert", "Loading one round"],
  reloadFinish: ["Finish", "Finishing a round-at-a-time reload"],
  pump: ["Pump", "Working the pump"],
};

const SPEEDS: { value: string; label: string }[] = [
  { value: "1", label: "1×" },
  { value: "0.5", label: "½" },
  { value: "0.25", label: "¼" },
  { value: "0.1", label: "⅒" },
];

/** What the preview's set to, kept between visits */
export interface PreviewSettings {
  mode: RigMode;
  speed: number;
  view: RigView;
  points: boolean;
  character: string;
  leftHanded: boolean;
  muted: boolean;
}

const SETTINGS_KEY = "gunBrowserPreview";

const DEFAULT_SETTINGS: PreviewSettings = {
  mode: "demo",
  speed: 1,
  view: "gun",
  points: false,
  character: CHARACTERS[0].name,
  leftHanded: false,
  muted: false,
};

export function usePreviewSettings(): [
  PreviewSettings,
  (change: Partial<PreviewSettings>) => void,
] {
  const [settings, setSettings] = useState<PreviewSettings>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const change = (changes: Partial<PreviewSettings>) =>
    setSettings((last) => {
      const next = { ...last, ...changes };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  return [settings, change];
}

/** The modes worth offering for these guns: the demonstration, and the animations any of them has */
export function modesFor(guns: GunStats[]): RigMode[] {
  return (Object.keys(MODE_LABELS) as RigMode[]).filter(
    (mode) =>
      mode === "demo" ||
      guns.some(
        (gun) => gun.animations[mode as keyof GunAnimations] !== undefined,
      ),
  );
}

export function RigPreview({
  guns,
  settings,
  change,
}: {
  guns: GunStats[];
  settings: PreviewSettings;
  change: (change: Partial<PreviewSettings>) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  // The guns it starts with; after that it's sent them, so it never reloads
  const [src] = useState(
    () =>
      `/?scene=rig&embed&follow&gun=${guns
        .map((gun) => gun.name.toLowerCase().replace(/[^a-z0-9]/g, ""))
        .join(",")}`,
  );
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<RigStatus>();
  // Where the scrubber's held, while paused
  const [held, setHeld] = useState<number>();
  const modes = modesFor(guns);
  const mode = modes.includes(settings.mode) ? settings.mode : "demo";

  const post = (message: RigCommand) =>
    frame.current?.contentWindow?.postMessage(message, window.location.origin);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) {
        return;
      }
      if (event.data?.type === "rigReady") {
        setReady(true);
      } else if (event.data?.type === "rigStatus") {
        setStatus(event.data);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  const show: RigShow = {
    type: "rigShow",
    guns: guns.map((gun) => gun.name),
    character: settings.character,
    leftHanded: settings.leftHanded,
    mode,
    speed: settings.speed,
    paused,
    points: settings.points,
    view: settings.view,
    muted: settings.muted,
  };
  const key = JSON.stringify(show);
  const latestShow = useRef(show);
  latestShow.current = show;
  useEffect(() => {
    if (ready) {
      post(show);
    }
  }, [ready, key]);

  // Sent again on the first click, which lets the game's sound start
  useEffect(() => {
    if (!ready) {
      return;
    }
    const unlock = () => post(latestShow.current);
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ready]);

  const togglePause = () => {
    setHeld(undefined);
    setPaused((p) => !p);
  };
  const seek = (progress: number) => {
    const clamped = Math.min(1, Math.max(0, progress));
    if (!paused) {
      setPaused(true);
    }
    setHeld(clamped);
    // The rig pauses itself to hold it there
    post({ type: "rigSeek", progress: clamped });
  };
  const step = () => {
    setHeld(undefined);
    post({ type: "rigStep" });
  };
  const restart = () => {
    setHeld(undefined);
    post({ type: "rigRestart" });
  };

  // The latest of everything, for the keys
  const latest = useRef({
    togglePause,
    seek,
    step,
    restart,
    status,
    held,
    settings,
    mode,
    modes,
  });
  latest.current = {
    togglePause,
    seek,
    step,
    restart,
    status,
    held,
    settings,
    mode,
    modes,
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.metaKey ||
        event.ctrlKey ||
        ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)
      ) {
        return;
      }
      const {
        togglePause,
        seek,
        step,
        restart,
        status,
        held,
        settings,
        mode,
        modes,
      } = latest.current;
      const speed = ["1", "2", "3", "4"].indexOf(event.key);
      if (speed >= 0) {
        change({ speed: Number(SPEEDS[speed].value) });
      } else if (event.key === " ") {
        togglePause();
      } else if (event.key === ".") {
        step();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const frames = event.key === "ArrowLeft" ? -1 : 1;
        // A sixtieth of a second of the animation as it's stretched
        const duration = status?.duration || 1;
        seek((held ?? status?.progress ?? 0) + frames / 60 / duration);
      } else if (event.key === "g") {
        change({ points: !settings.points });
      } else if (event.key === "v") {
        change({ view: settings.view === "gun" ? "lineup" : "gun" });
      } else if (event.key === "m") {
        change({ mode: modes[(modes.indexOf(mode) + 1) % modes.length] });
      } else if (event.key === "Enter") {
        restart();
      } else {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const progress = held ?? status?.progress ?? 0;
  const animationName = status?.animation
    ? (MODE_LABELS[status.animation as RigMode]?.[0] ?? status.animation)
    : undefined;

  return (
    <div class="rig-preview">
      <div class="rig-preview__frame">
        <iframe
          ref={frame}
          src={src}
          tabIndex={-1}
          allow="autoplay"
          title="The gun in someone's hands"
        />
        {!ready && (
          <div class="rig-preview__loading muted">Starting the game…</div>
        )}
      </div>

      <div class="rig-preview__controls">
        <Segmented
          value={mode}
          options={modes.map((m) => ({
            value: m,
            label: MODE_LABELS[m][0],
            tip: MODE_LABELS[m][1],
          }))}
          onChange={(m) => change({ mode: m })}
        />
        <div class="rig-preview__row">
          <button
            class="rig-preview__play"
            onClick={togglePause}
            data-tip={paused ? "Play (Space)" : "Pause (Space)"}
          >
            {paused ? "▶" : "❚❚"}
          </button>
          <button onClick={step} disabled={!paused} data-tip="One frame (.)">
            ›|
          </button>
          <input
            class="rig-preview__scrub"
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onInput={(e) => seek(Number((e.target as HTMLInputElement).value))}
            data-tip="Scrub the animation (← →, a frame at a time)"
          />
          <button onClick={restart} data-tip="Start over (Enter)">
            ↺
          </button>
        </div>
        <div class="rig-preview__row rig-preview__status small muted">
          <span>
            {animationName
              ? `${animationName} ${Math.round(progress * 100)}% of ${status!.duration.toFixed(2)} s`
              : "No animation playing"}
          </span>
          {status && (
            <span>
              {status.ammo}/{status.capacity}
              {status.reloading ? " · reloading" : ""}
            </span>
          )}
        </div>
        <div class="rig-preview__row">
          <Segmented
            value={String(settings.speed)}
            options={SPEEDS.map((s, i) => ({
              ...s,
              tip: `${s.label} speed (${i + 1})`,
            }))}
            onChange={(speed) => change({ speed: Number(speed) })}
          />
          <Segmented
            value={settings.view}
            options={[
              { value: "gun", label: "Close", tip: "Close on the gun (V)" },
              {
                value: "lineup",
                label: "Whole",
                tip: "Whoever's holding it (V)",
              },
            ]}
            onChange={(view) => change({ view })}
          />
        </div>
        <div class="rig-preview__row">
          <Chip
            on={settings.points}
            onClick={() => change({ points: !settings.points })}
            tip="Mark the points on the gun and ring the hands (G)"
          >
            Points
          </Chip>
          <Chip
            on={settings.leftHanded}
            onClick={() => change({ leftHanded: !settings.leftHanded })}
            tip="Held left-handed: the pose mirrored"
          >
            Left-handed
          </Chip>
          <Chip
            on={!settings.muted}
            onClick={() => change({ muted: !settings.muted })}
            tip="The gun's sounds"
          >
            Sound
          </Chip>
          <select
            value={settings.character}
            onChange={(e) =>
              change({ character: (e.target as HTMLSelectElement).value })
            }
            data-tip="Who's holding it"
          >
            {CHARACTERS.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  tip,
  children,
}: {
  on: boolean;
  onClick: () => void;
  tip: string;
  children: string;
}) {
  return (
    <button
      class={`chip ${on ? "is-on" : ""}`}
      onClick={onClick}
      data-tip={tip}
    >
      {children}
    </button>
  );
}

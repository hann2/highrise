import { useMemo, useState } from "preact/hooks";
import { RESOURCES } from "../../../resources/resources";
import { CharacterData } from "../../highrise/characters/CharacterData";
import { PlayerStats } from "../../highrise/human/PlayerStats";
import { GUNS } from "../../highrise/weapons/guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "../../highrise/weapons/melee/melee-weapons/meleeWeapons";
import { WeaponStats } from "../../highrise/weapons/WeaponStats";
import { CharacterChanges, CharacterEntry, Voice } from "./apiTypes";
import { DraftField, DraftStore, FIELD_LABELS } from "./drafts";
import { RunAction } from "./App";
import { ClipsSection } from "./ClipsSection";
import { EditableText } from "./EditableText";
import { playingKey, toggle } from "./player";
import { resolveLook } from "../../highrise/looks/BodyLook";
import { portraitUrl } from "../../highrise/looks/composeBody";
import { usePlaying } from "./usePlaying";
import { AppearanceTab } from "./AppearanceTab";

const NEUTRAL_STATS = new PlayerStats();

/** The stats in the order and groups `PlayerStats` has them */
const STAT_GROUPS: [string, (keyof PlayerStats)[]][] = [
  ["Movement and health", ["moveSpeed", "maxHp", "damageTaken", "sprintSpeed"]],
  ["Weapons", ["damage", "reloadSpeed", "fireRate", "spread"]],
  ["Push", ["pushDamage", "pushKnockback", "pushStun"]],
  ["Seeing", ["flashlightRange", "visionRange"]],
  [
    "Rules",
    [
      "meleeKillHeal",
      "instantEmptyReload",
      "oneHitCrawlers",
      "floorHeal",
      "killAmmoDropChance",
    ],
  ],
];

function humanize(name: string): string {
  const words = name.replace(/([A-Z])/g, " $1").toLowerCase();
  return words[0].toUpperCase() + words.slice(1).replace(/\bhp\b/, "HP");
}

const isPrimary = (weapon: WeaponStats) =>
  "ammoClass" in weapon && weapon.ammoClass !== "pistol";
const PRIMARIES = GUNS.filter(isPrimary);
const SECONDARIES = [
  ...GUNS.filter((gun) => !isPrimary(gun)),
  ...MELEE_WEAPONS,
];

const TABS = [
  ["appearance", "Appearance"],
  ["gameplay", "Gameplay"],
  ["voice", "Voice"],
] as const;
type Tab = (typeof TABS)[number][0];

/** The draft fields each tab edits, for marking tabs with unsaved changes */
const TAB_FIELDS: Record<Tab, DraftField[]> = {
  appearance: ["look"],
  gameplay: ["startingWeapons", "stats"],
  voice: ["voice"],
};

const isMac = navigator.platform.startsWith("Mac");
const shortcut = (key: string) => (isMac ? `⌘${key}` : `Ctrl+${key}`);

/** "a", "a and b", "a, b and c" */
function listOf(words: string[]): string {
  return words.length < 2
    ? words.join("")
    : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

/** The tab last looked at, kept when switching characters and reloading */
function savedTab(): Tab {
  try {
    const tab = localStorage.getItem("characterEditorTab");
    return TABS.some(([id]) => id === tab) ? (tab as Tab) : "appearance";
  } catch {
    return "appearance";
  }
}

export function CharacterPanel({
  entry: { id, data: disk },
  voices,
  voicesError,
  run,
  drafts,
  onSave,
  onSaveAll,
  unsavedCount,
}: {
  entry: CharacterEntry;
  voices?: Voice[];
  voicesError?: string;
  run: RunAction;
  drafts: DraftStore;
  onSave: () => void;
  onSaveAll: () => void;
  /** How many characters have unsaved changes, this one included */
  unsavedCount: number;
}) {
  const [tab, setTab] = useState<Tab>(savedTab);
  // What's being edited: what's on disk with the unsaved edits on top
  const data = drafts.edited(id, disk);
  const unsaved = drafts.unsaved(id, disk);
  const look = useMemo(() => resolveLook(data.look), [data.look]);
  const update = (changes: CharacterChanges, group?: string) =>
    drafts.edit(id, disk, changes, group);
  const chooseTab = (next: Tab) => {
    setTab(next);
    try {
      localStorage.setItem("characterEditorTab", next);
    } catch {}
  };

  return (
    <div class="panel">
      <SaveBar
        unsaved={unsaved}
        otherUnsaved={unsavedCount - (unsaved.length > 0 ? 1 : 0)}
        canUndo={drafts.canUndo(id)}
        canRedo={drafts.canRedo(id)}
        onUndo={() => drafts.undo(id, disk)}
        onRedo={() => drafts.redo(id, disk)}
        onRevert={() => drafts.revert(id, disk)}
        onSave={onSave}
        onSaveAll={onSaveAll}
      />
      <header class="panel__header">
        <img class="sprite-preview" src={portraitUrl(look, { scale: 260 })} />
        <div class="panel__title">
          <EditableText
            class={`panel__name ${unsaved.includes("name") ? "is-unsaved" : ""}`}
            value={data.name}
            onSave={(name) => update({ name })}
          />
          <div class="muted panel__id">
            characters/data/{id}.json · audio in {id}/
          </div>
          <EditableText
            multiline
            class={`panel__description ${unsaved.includes("description") ? "is-unsaved" : ""}`}
            value={data.description}
            placeholder="Who are they? This is what their lines get written from."
            onSave={(description) => update({ description })}
          />
        </div>
      </header>

      <nav class="tabs">
        {TABS.map(([tabId, label]) => (
          <button
            key={tabId}
            class={`tabs__tab ${tab === tabId ? "is-selected" : ""}`}
            onClick={() => chooseTab(tabId)}
          >
            {label}
            {TAB_FIELDS[tabId].some((field) => unsaved.includes(field)) && (
              <span class="unsaved-dot" title="Unsaved changes" />
            )}
            {tabId === "voice" && (
              <span class="tabs__count">
                {data.clips.filter((clip) => clip.enabled).length}/
                {data.clips.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === "appearance" && (
        <AppearanceTab
          look={look}
          onChange={(look, group) => update({ look }, group)}
        />
      )}

      {tab === "gameplay" && (
        <div class="panel__grid">
          <section class="card">
            <h2>Starting weapons</h2>
            <p class="muted small">
              The leader starts a run with these; as a survivor, they carry them
              instead of a random pistol.
            </p>
            <WeaponPicker
              label="Primary"
              options={PRIMARIES}
              data={data}
              onChange={(startingWeapons) => update({ startingWeapons })}
            />
            <WeaponPicker
              label="Secondary"
              options={SECONDARIES}
              data={data}
              onChange={(startingWeapons) => update({ startingWeapons })}
            />
          </section>

          <section class="card card--wide">
            <h2>Stats</h2>
            <p class="muted small">
              Blank is the same as everyone else. Items apply on top.
            </p>
            <StatsEditor
              stats={data.stats}
              onChange={(stats) => update({ stats })}
            />
          </section>
        </div>
      )}

      {tab === "voice" && (
        <>
          <div class="panel__grid">
            <section class="card">
              <h2>Voice</h2>
              <VoicePicker
                data={data}
                voices={voices}
                voicesError={voicesError}
                onChange={(voice) => update({ voice })}
              />
            </section>
          </div>
          <ClipsSection id={id} data={data} run={run} />
        </>
      )}
    </div>
  );
}

function WeaponPicker({
  label,
  options,
  data,
  onChange,
}: {
  label: string;
  options: WeaponStats[];
  data: CharacterData;
  onChange: (startingWeapons: string[]) => void;
}) {
  const names = options.map((weapon) => weapon.name);
  const current = data.startingWeapons.find((name) => names.includes(name));
  const others = data.startingWeapons.filter((name) => !names.includes(name));
  const weapon = options.find((w) => w.name === current);
  return (
    <label class="weapon">
      <span class="weapon__label">{label}</span>
      <span class="weapon__icon">
        {weapon && <img src={RESOURCES.images[weapon.textures.pickup]} />}
      </span>
      <select
        value={current ?? ""}
        onChange={(event) => {
          const name = (event.target as HTMLSelectElement).value;
          // The primary goes last, so it's the one in hand
          const weapons =
            label === "Primary" ? [...others, name] : [name, ...others];
          onChange(weapons.filter(Boolean));
        }}
      >
        <option value="">None</option>
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function VoicePicker({
  data,
  voices,
  voicesError,
  onChange,
}: {
  data: CharacterData;
  voices?: Voice[];
  voicesError?: string;
  onChange: (voice: CharacterData["voice"] | null) => void;
}) {
  usePlaying();
  const voiceId = data.voice?.elevenLabsVoiceId ?? "";
  const voice = voices?.find((v) => v.voiceId === voiceId);
  const sorted = [...(voices ?? [])].sort(
    (a, b) =>
      Number(b.category !== "premade") - Number(a.category !== "premade") ||
      a.name.localeCompare(b.name),
  );
  const set = (id: string) =>
    onChange(id ? { elevenLabsVoiceId: id.trim() } : null);
  return (
    <div class="voice">
      {voicesError && <p class="error small">{voicesError}</p>}
      <div class="voice__row">
        <select
          value={voice ? voiceId : voiceId ? "custom" : ""}
          onChange={(event) => {
            const value = (event.target as HTMLSelectElement).value;
            if (value !== "custom") {
              set(value);
            }
          }}
        >
          <option value="">No voice</option>
          {voiceId && !voice && <option value="custom">{voiceId}</option>}
          {sorted.map((v) => (
            <option key={v.voiceId} value={v.voiceId}>
              {v.name}
              {v.category !== "premade" ? ` (${v.category})` : ""}
            </option>
          ))}
        </select>
        {voice?.previewUrl && (
          <button
            class="play"
            title="Play ElevenLabs' sample of this voice"
            onClick={() => toggle(voice.previewUrl!, "voice-preview")}
          >
            {playingKey() === "voice-preview" ? "■" : "▶"}
          </button>
        )}
      </div>
      {voice?.description && (
        <p class="muted small voice__description">{voice.description}</p>
      )}
      <label class="small voice__id">
        Voice ID
        <EditableText
          value={voiceId}
          placeholder="Paste an ElevenLabs voice ID"
          onSave={set}
        />
      </label>
    </div>
  );
}

function StatsEditor({
  stats,
  onChange,
}: {
  stats: CharacterData["stats"];
  onChange: (stats: CharacterData["stats"]) => void;
}) {
  const set = (
    stat: keyof PlayerStats,
    value: number | boolean | undefined,
  ) => {
    const next = { ...stats } as Record<string, number | boolean>;
    if (value === undefined || value === NEUTRAL_STATS[stat]) {
      delete next[stat];
    } else {
      next[stat] = value;
    }
    onChange(next);
  };
  return (
    <div class="stats">
      {STAT_GROUPS.map(([group, keys]) => (
        <div key={group} class="stats__group">
          <h3>{group}</h3>
          {keys.map((stat) => {
            const neutral = NEUTRAL_STATS[stat];
            const value = stats[stat];
            const changed = value !== undefined;
            return (
              <label key={stat} class={`stat ${changed ? "is-changed" : ""}`}>
                <span class="stat__name">{humanize(stat)}</span>
                {typeof neutral === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={(value ?? neutral) as boolean}
                    onChange={(event) =>
                      set(stat, (event.target as HTMLInputElement).checked)
                    }
                  />
                ) : (
                  <EditableText
                    class="stat__input"
                    value={changed ? String(value) : ""}
                    placeholder={String(neutral)}
                    onSave={(text) =>
                      set(
                        stat,
                        text.trim() === "" || isNaN(Number(text))
                          ? undefined
                          : Number(text),
                      )
                    }
                  />
                )}
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Whether this character has unsaved changes, and what to do about them.
 * Sticks to the top of the page.
 */
function SaveBar({
  unsaved,
  otherUnsaved,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onRevert,
  onSave,
  onSaveAll,
}: {
  unsaved: DraftField[];
  otherUnsaved: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRevert: () => void;
  onSave: () => void;
  onSaveAll: () => void;
}) {
  const dirty = unsaved.length > 0;
  return (
    <div class={`save-bar ${dirty ? "is-dirty" : ""}`}>
      <span class="save-bar__state">
        {dirty ? (
          <>
            <span class="unsaved-dot" />
            Unsaved changes to {listOf(unsaved.map((f) => FIELD_LABELS[f]))}
          </>
        ) : (
          <span class="muted">Saved</span>
        )}
      </span>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title={`Undo (${shortcut("Z")})`}
      >
        Undo
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title={`Redo (${shortcut(isMac ? "⇧Z" : "Y")})`}
      >
        Redo
      </button>
      <button
        onClick={onRevert}
        disabled={!dirty}
        title="Go back to what's saved; Undo brings the changes back"
      >
        Revert
      </button>
      {otherUnsaved > 0 && (
        <button
          onClick={onSaveAll}
          title="Save every character with unsaved changes"
        >
          Save all ({otherUnsaved + (dirty ? 1 : 0)})
        </button>
      )}
      <button
        class="primary"
        onClick={onSave}
        disabled={!dirty}
        title={`Save to characters/data (${shortcut("S")})`}
      >
        Save
      </button>
    </div>
  );
}

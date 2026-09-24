import { ImageName, RESOURCES } from "../../../resources/resources";
import {
  CHARACTER_TEXTURE_PARTS,
  CharacterData,
} from "../../highrise/characters/CharacterData";
import { PlayerStats } from "../../highrise/human/PlayerStats";
import { GUNS } from "../../highrise/weapons/guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "../../highrise/weapons/melee/melee-weapons/meleeWeapons";
import { WeaponStats } from "../../highrise/weapons/WeaponStats";
import { api } from "./api";
import { CharacterChanges, CharacterEntry, Voice } from "./apiTypes";
import { RunAction } from "./App";
import { ClipsSection } from "./ClipsSection";
import { EditableText } from "./EditableText";
import { playingKey, toggle } from "./player";
import { SpritePreview } from "./SpritePreview";
import { usePlaying } from "./usePlaying";

const NEUTRAL_STATS = new PlayerStats();

/** The stats in the order and groups `PlayerStats` has them */
const STAT_GROUPS: [string, (keyof PlayerStats)[]][] = [
  ["Movement and health", ["moveSpeed", "maxHp"]],
  ["Weapons", ["damage", "reloadSpeed", "fireRate", "spread", "magazineSize"]],
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

const PART_LABELS: Record<(typeof CHARACTER_TEXTURE_PARTS)[number], string> = {
  head: "Head",
  torso: "Torso",
  leftArm: "Left arm",
  leftHand: "Left hand",
  rightArm: "Right arm",
  rightHand: "Right hand",
};

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

export function CharacterPanel({
  entry: { id, data },
  voices,
  voicesError,
  run,
}: {
  entry: CharacterEntry;
  voices?: Voice[];
  voicesError?: string;
  run: RunAction;
}) {
  const update = (changes: CharacterChanges, message = "Saving…") =>
    run(message, () => api.updateCharacter(id, changes));

  return (
    <div class="panel">
      <header class="panel__header">
        <SpritePreview textures={data.textures} size={140} />
        <div class="panel__title">
          <EditableText
            class="panel__name"
            value={data.name}
            onSave={(name) => update({ name })}
          />
          <div class="muted panel__id">
            characters/data/{id}.json · audio in {id}/
          </div>
          <EditableText
            multiline
            class="panel__description"
            value={data.description}
            placeholder="Who are they? This is what their lines get written from."
            onSave={(description) => update({ description })}
          />
        </div>
      </header>

      <div class="panel__grid">
        <section class="card">
          <h2>Body</h2>
          <div class="parts">
            {CHARACTER_TEXTURE_PARTS.map((part) => (
              <PartPicker
                key={part}
                part={part}
                value={data.textures[part]}
                onChange={(image) =>
                  update({ textures: { ...data.textures, [part]: image } })
                }
              />
            ))}
          </div>
        </section>

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

        <section class="card">
          <h2>Voice</h2>
          <VoicePicker
            data={data}
            voices={voices}
            voicesError={voicesError}
            onChange={(voice) => update({ voice })}
          />
        </section>

        <section class="card card--stats">
          <h2>Stats</h2>
          <p class="muted small">
            Blank is the same as everyone else. Upgrades apply on top.
          </p>
          <StatsEditor
            stats={data.stats}
            onChange={(stats) => update({ stats })}
          />
        </section>
      </div>

      <ClipsSection id={id} data={data} run={run} />
    </div>
  );
}

function PartPicker({
  part,
  value,
  onChange,
}: {
  part: (typeof CHARACTER_TEXTURE_PARTS)[number];
  value: string;
  onChange: (image: string) => void;
}) {
  const suffix = part[0].toUpperCase() + part.slice(1);
  const options = Object.keys(RESOURCES.images).filter((name) =>
    name.endsWith(suffix),
  );
  return (
    <label class="part">
      <img src={RESOURCES.images[value as ImageName]} />
      <span class="part__label">{PART_LABELS[part]}</span>
      <select
        value={value}
        onChange={(event) =>
          onChange((event.target as HTMLSelectElement).value)
        }
      >
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
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

import { useEffect, useState } from "preact/hooks";
import {
  CHARACTER_SOUND_CLASSES,
  CharacterData,
  CharacterSoundClass,
  VoiceClip,
} from "../../highrise/characters/CharacterData";
import { api } from "./api";
import { ClipChanges, GenerateRequest } from "./apiTypes";
import { RunAction } from "./App";
import { CATEGORY_INFO } from "./categories";
import { EditableText } from "./EditableText";
import { playInTurn, playingKey, stop, toggle } from "./player";
import { usePlaying } from "./usePlaying";

type Show = "all" | "enabled" | "disabled" | "untranscribed";

/** Where a generate form is open: a category's new line, or variations of a clip */
type FormAt = { category: CharacterSoundClass; basedOn?: VoiceClip };

export function ClipsSection({
  id,
  data,
  run,
}: {
  id: string;
  data: CharacterData;
  run: RunAction;
}) {
  usePlaying();
  const [show, setShow] = useState<Show>("all");
  const [search, setSearch] = useState("");
  const [formAt, setFormAt] = useState<FormAt>();
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<CharacterSoundClass>>(
    new Set(),
  );

  const matches = (clip: VoiceClip) =>
    (show === "all" ||
      (show === "enabled" && clip.enabled) ||
      (show === "disabled" && !clip.enabled) ||
      (show === "untranscribed" && !clip.text)) &&
    (!search ||
      `${clip.text} ${clip.file}`.toLowerCase().includes(search.toLowerCase()));

  const generate = async (request: GenerateRequest) => {
    const clips = await run(
      `Generating ${request.count} take${request.count > 1 ? "s" : ""} of “${request.text}”…`,
      () => api.generate(id, request),
    );
    if (clips) {
      setFresh(new Set([...fresh, ...clips.map((clip) => clip.file)]));
      setFormAt(undefined);
      // Hear them one after another
      playInTurn(
        clips.map((clip) => ({
          url: api.audioUrl(id, clip.file),
          key: `${request.categories[0]}:${clip.file}`,
        })),
      );
    }
  };

  const playAll = (clips: VoiceClip[], category: CharacterSoundClass) => {
    if (playingKey()?.startsWith(`${category}:`)) {
      stop();
    } else {
      playInTurn(
        clips.map((clip) => ({
          url: api.audioUrl(id, clip.file),
          key: `${category}:${clip.file}`,
        })),
      );
    }
  };

  const enabledCount = data.clips.filter((clip) => clip.enabled).length;
  const untranscribed = data.clips.filter((clip) => !clip.text).length;

  return (
    <section class="clips">
      <div class="clips__header">
        <h2>Voice lines</h2>
        <span class="muted">
          {enabledCount} enabled of {data.clips.length}
        </span>
        <div class="clips__filters">
          {(
            [
              ["all", "All"],
              ["enabled", "Enabled"],
              ["disabled", "Disabled"],
              ["untranscribed", `No text (${untranscribed})`],
            ] as [Show, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              class={`chip-button ${show === value ? "is-on" : ""}`}
              onClick={() => setShow(value)}
            >
              {label}
            </button>
          ))}
          <input
            class="clips__search"
            type="search"
            placeholder="Search text or file"
            value={search}
            onInput={(event) =>
              setSearch((event.target as HTMLInputElement).value)
            }
          />
        </div>
      </div>
      {!data.voice && (
        <p class="muted small">Pick a voice above to generate new lines.</p>
      )}

      {CHARACTER_SOUND_CLASSES.map((category) => {
        const inCategory = data.clips.filter((clip) =>
          clip.categories.includes(category),
        );
        const enabled = inCategory.filter((clip) => clip.enabled);
        const visible = inCategory.filter(matches);
        const isCollapsed = collapsed.has(category);
        const info = CATEGORY_INFO[category];
        return (
          <div key={category} class="category">
            <div class="category__header">
              <button
                class="category__toggle"
                onClick={() => {
                  const next = new Set(collapsed);
                  isCollapsed ? next.delete(category) : next.add(category);
                  setCollapsed(next);
                }}
              >
                {isCollapsed ? "▸" : "▾"} <h3>{info.label}</h3>
              </button>
              <span
                class={`category__count ${enabled.length === 0 ? "is-empty" : ""}`}
              >
                {enabled.length} enabled
                {inCategory.length > enabled.length &&
                  ` · ${inCategory.length - enabled.length} off`}
              </span>
              <span class="category__when muted small">{info.when}</span>
              <div class="category__actions">
                {enabled.length > 0 && (
                  <button
                    class="text-button"
                    title="Play every enabled clip in this category"
                    onClick={() => playAll(enabled, category)}
                  >
                    {playingKey()?.startsWith(`${category}:`)
                      ? "■ Stop"
                      : "▶ Play enabled"}
                  </button>
                )}
                <button
                  class="text-button"
                  disabled={!data.voice}
                  onClick={() => setFormAt({ category })}
                >
                  + New line
                </button>
              </div>
            </div>
            {!isCollapsed && (
              <div class="category__body">
                {formAt?.category === category && !formAt.basedOn && (
                  <GenerateForm
                    initial={{ text: "", categories: [category] }}
                    onGenerate={generate}
                    onCancel={() => setFormAt(undefined)}
                  />
                )}
                {visible.map((clip) => (
                  <div key={clip.file}>
                    <ClipRow
                      id={id}
                      clip={clip}
                      take={takeNumber(inCategory, clip)}
                      category={category}
                      isFresh={fresh.has(clip.file)}
                      canGenerate={!!data.voice}
                      run={run}
                      onVariations={() =>
                        setFormAt({ category, basedOn: clip })
                      }
                    />
                    {formAt?.category === category &&
                      formAt.basedOn?.file === clip.file && (
                        <GenerateForm
                          initial={{
                            text: clip.text,
                            categories: clip.categories,
                            basedOn: clip.file,
                          }}
                          onGenerate={generate}
                          onCancel={() => setFormAt(undefined)}
                        />
                      )}
                  </div>
                ))}
                {visible.length === 0 && (
                  <p class="muted small category__empty">
                    {inCategory.length === 0
                      ? "No lines yet."
                      : "Nothing matches the filter."}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** Which take of its text a clip is, counting clips before it with the same text */
function takeNumber(clips: VoiceClip[], clip: VoiceClip): number {
  const same = clips.filter((c) => c.text && c.text === clip.text);
  return same.length > 1 ? same.indexOf(clip) + 1 : 0;
}

function ClipRow({
  id,
  clip,
  take,
  category,
  isFresh,
  canGenerate,
  run,
  onVariations,
}: {
  id: string;
  clip: VoiceClip;
  /** 1, 2, 3... for takes of the same text; 0 if the text is unique */
  take: number;
  category: CharacterSoundClass;
  isFresh: boolean;
  canGenerate: boolean;
  run: RunAction;
  onVariations: () => void;
}) {
  const key = `${category}:${clip.file}`;
  const playing = playingKey() === key;
  // Shown right away, until the saved clip comes back (or the save fails)
  const [pending, setPending] = useState<ClipChanges>({});
  useEffect(() => setPending({}), [clip]);
  const update = async (changes: ClipChanges, message: string) => {
    setPending({ ...pending, ...changes });
    const saved = await run(message, () =>
      api.updateClip(id, clip.file, changes),
    );
    if (!saved) {
      setPending({});
    }
  };
  const shown = { ...clip, ...pending };

  const details = [
    clip.file,
    clip.source === "recorded" ? "Recorded" : `ElevenLabs ${clip.model ?? ""}`,
    clip.created && `made ${clip.created}`,
    clip.stability !== undefined && `stability ${clip.stability}`,
    clip.basedOn && `variation of ${clip.basedOn}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      class={`clip ${shown.enabled ? "is-enabled" : "is-disabled"} ${isFresh ? "is-fresh" : ""} ${take > 1 ? "is-retake" : ""}`}
    >
      <button
        class={`play ${playing ? "is-playing" : ""}`}
        title="Play"
        onClick={() => toggle(api.audioUrl(id, clip.file), key)}
      >
        {playing ? "■" : "▶"}
      </button>
      <label
        class="switch"
        title={
          shown.enabled
            ? "Enabled: in the game. Click to take it out."
            : "Disabled: not in the game. Click to put it in."
        }
      >
        <input
          type="checkbox"
          checked={shown.enabled}
          onChange={() =>
            update(
              { enabled: !shown.enabled },
              shown.enabled ? "Disabling…" : "Enabling…",
            )
          }
        />
        <span />
      </label>
      <EditableText
        class="clip__text"
        value={clip.text}
        placeholder="No transcript"
        onSave={(text) => update({ text }, "Saving…")}
      />
      {take > 0 && <span class="clip__take">take {take}</span>}
      <span class={`badge badge--${clip.source}`} title={details}>
        {clip.source === "recorded" ? "REC" : "AI"}
        {isFresh && " · new"}
      </span>
      <CategoryMenu
        categories={shown.categories}
        onChange={(categories) => update({ categories }, "Saving…")}
      />
      <div class="clip__actions">
        <button
          class="icon-button"
          title="Generate variations of this line"
          disabled={!canGenerate}
          onClick={onVariations}
        >
          ↻
        </button>
        <button
          class="icon-button"
          title="Replace the text with what speech-to-text hears"
          onClick={() =>
            run("Transcribing…", () => api.transcribe(id, clip.file))
          }
        >
          ✎
        </button>
        <button
          class="icon-button"
          title="Trim the silence off the ends and set the loudness (replaces the file)"
          onClick={() => {
            const warning =
              "This replaces the recording. If it's committed, git still has the original.";
            if (
              clip.source !== "recorded" ||
              confirm(`Clean up ${clip.file}?\n\n${warning}`)
            ) {
              run("Trimming and leveling…", () => api.cleanUp(id, clip.file));
            }
          }}
        >
          ✂
        </button>
        <button
          class="icon-button"
          title="Open in Ocenaudio. Save there, then play it here again."
          onClick={() => run("Opening…", () => api.openInEditor(id, clip.file))}
        >
          ↗
        </button>
        <button
          class="icon-button icon-button--danger"
          title="Delete this clip and its audio file"
          onClick={() => {
            const warning =
              clip.source === "recorded"
                ? "\n\nThis is a recording. Once it's deleted, the only copy left is in git history."
                : "";
            if (confirm(`Delete ${clip.file}?${warning}`)) {
              run("Deleting…", () => api.deleteClip(id, clip.file));
            }
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

function CategoryMenu({
  categories,
  onChange,
}: {
  categories: CharacterSoundClass[];
  onChange: (categories: CharacterSoundClass[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const label =
    categories.length === 1
      ? CATEGORY_INFO[categories[0]].label
      : `${categories.length} categories`;
  return (
    <div class="category-menu">
      <button
        class="category-menu__button"
        title={categories.map((c) => CATEGORY_INFO[c].label).join(", ")}
        onClick={() => setOpen(!open)}
      >
        {label} ▾
      </button>
      {open && (
        <div class="category-menu__list" onMouseLeave={() => setOpen(false)}>
          {CHARACTER_SOUND_CLASSES.map((category) => (
            <label key={category}>
              <input
                type="checkbox"
                checked={categories.includes(category)}
                disabled={categories.length === 1 && categories[0] === category}
                onChange={() =>
                  onChange(
                    categories.includes(category)
                      ? categories.filter((c) => c !== category)
                      : CHARACTER_SOUND_CLASSES.filter(
                          (c) => c === category || categories.includes(c),
                        ),
                  )
                }
              />
              {CATEGORY_INFO[category].label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const STABILITIES: [number, string, string][] = [
  [0, "Creative", "Most expressive, and most likely to go off script"],
  [0.5, "Natural", "Balanced"],
  [1, "Robust", "Steadiest, and least responsive to audio tags"],
];

function GenerateForm({
  initial,
  onGenerate,
  onCancel,
}: {
  initial: {
    text: string;
    categories: CharacterSoundClass[];
    basedOn?: string;
  };
  onGenerate: (request: GenerateRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial.text);
  const [count, setCount] = useState(3);
  const [stability, setStability] = useState(0.5);
  const [busy, setBusy] = useState(false);

  const submit = async (event: Event) => {
    event.preventDefault();
    if (!text.trim() || busy) {
      return;
    }
    setBusy(true);
    try {
      await onGenerate({
        text: text.trim(),
        categories: initial.categories,
        count,
        stability,
        basedOn: initial.basedOn,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form class="generate" onSubmit={submit}>
      <div class="generate__title small">
        {initial.basedOn
          ? `Variations of ${initial.basedOn}. Edit the text to try a different wording; the original stays.`
          : "A new line. Takes come in disabled: listen, then enable the ones you like."}
      </div>
      <textarea
        rows={2}
        value={text}
        autoFocus
        placeholder="[sighs] What they say, with audio tags like [sarcastic], [whispers], [shouting], [laughs]"
        onInput={(event) =>
          setText((event.target as HTMLTextAreaElement).value)
        }
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            submit(event);
          } else if (event.key === "Escape") {
            onCancel();
          }
        }}
      />
      <div class="generate__options">
        <label>
          Takes
          <select
            value={count}
            onChange={(event) =>
              setCount(Number((event.target as HTMLSelectElement).value))
            }
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Delivery
          <select
            value={stability}
            onChange={(event) =>
              setStability(Number((event.target as HTMLSelectElement).value))
            }
          >
            {STABILITIES.map(([value, label, description]) => (
              <option key={value} value={value} title={description}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <span class="muted small" title="ElevenLabs bills by characters">
          {text.length * count} characters
        </span>
        <div class="generate__buttons">
          <button type="button" class="text-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" class="primary" disabled={busy || !text.trim()}>
            {busy ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </form>
  );
}

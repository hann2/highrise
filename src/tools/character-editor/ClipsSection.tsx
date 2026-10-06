import { useEffect, useState } from "preact/hooks";
import {
  CHARACTER_SOUND_CLASSES,
  CharacterData,
  CharacterSoundClass,
  VoiceClip,
} from "../../highrise/characters/CharacterData";
import { api } from "./api";
import {
  ClipChanges,
  ClipMove,
  CONVERSION_MODELS,
  ConversionModel,
  ConvertRequest,
  GenerateRequest,
} from "./apiTypes";
import { RunAction } from "./App";
import { CATEGORY_INFO } from "./categories";
import { moveClip } from "./clipOrder";
import { Slider } from "./controls";
import { EditableText } from "./EditableText";
import { playInTurn, playingKey, stop, toggle } from "./player";
import { usePlaying } from "./usePlaying";

type Show = "all" | "enabled" | "disabled" | "untranscribed";

/**
 * Where a form is open: a category's new line, or under a clip, variations
 * of it or (`convert`) the voice changer
 */
type FormAt = {
  category: CharacterSoundClass;
  basedOn?: VoiceClip;
  convert?: boolean;
};

/** A clip being dragged, and the category it was picked up from */
type Dragging = { clip: VoiceClip; from: CharacterSoundClass };

/** Where a dragged clip would go: next to a clip, or with neither, last in the category */
type DropAt = {
  category: CharacterSoundClass;
  before?: string;
  after?: string;
};

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
  const [dragging, setDragging] = useState<Dragging>();
  const [dropAt, setDropAt] = useState<DropAt>();
  // A move shown right away, until the saved clips come back (or it fails)
  const [moved, setMoved] = useState<VoiceClip[]>();
  useEffect(() => setMoved(undefined), [data.clips]);
  const clips = moved ?? data.clips;

  const matches = (clip: VoiceClip) =>
    (show === "all" ||
      (show === "enabled" && clip.enabled) ||
      (show === "disabled" && !clip.enabled) ||
      (show === "untranscribed" && !clip.text)) &&
    (!search ||
      `${clip.text} ${clip.file}`.toLowerCase().includes(search.toLowerCase()));

  const takesArrived = (clips: VoiceClip[], category: CharacterSoundClass) => {
    setFresh(new Set([...fresh, ...clips.map((clip) => clip.file)]));
    setFormAt(undefined);
    // Hear them one after another
    playInTurn(
      clips.map((clip) => ({
        url: api.audioUrl(id, clip.file),
        key: `${category}:${clip.file}`,
      })),
    );
  };

  const generate = async (request: GenerateRequest) => {
    const clips = await run(
      `Generating ${takes(request.count)} of “${request.text}”…`,
      () => api.generate(id, request),
    );
    if (clips) {
      takesArrived(clips, request.categories[0]);
    }
  };

  const convert = async (
    clip: VoiceClip,
    category: CharacterSoundClass,
    request: ConvertRequest,
  ) => {
    const clips = await run(
      `Changing the voice of ${clip.file}: ${takes(request.count)}…`,
      () => api.convert(id, clip.file, request),
    );
    if (clips) {
      takesArrived(clips, category);
    }
  };

  const playAll = (toPlay: VoiceClip[], category: CharacterSoundClass) => {
    if (playingKey()?.startsWith(`${category}:`)) {
      stop();
    } else {
      playInTurn(
        toPlay.map((clip) => ({
          url: api.audioUrl(id, clip.file),
          key: `${category}:${clip.file}`,
        })),
      );
    }
  };

  /**
   * Where a drag over `category` (over `clip`'s row, if it's over one) would
   * drop: before the row in its top half, after it in its bottom half
   */
  const dropPlace = (
    event: DragEvent,
    category: CharacterSoundClass,
    clip?: VoiceClip,
  ): DropAt => {
    const row = (event.currentTarget as HTMLElement).querySelector(".clip");
    if (!clip || !row) {
      return { category };
    }
    const { top, height } = row.getBoundingClientRect();
    return event.clientY < top + height / 2
      ? { category, before: clip.file }
      : { category, after: clip.file };
  };

  const dragOver = (
    event: DragEvent,
    category: CharacterSoundClass,
    clip?: VoiceClip,
  ) => {
    if (!dragging) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect =
      event.altKey && category !== dragging.from ? "copy" : "move";
    const at =
      clip?.file === dragging.clip.file && category === dragging.from
        ? undefined
        : dropPlace(event, category, clip);
    if (
      at?.category !== dropAt?.category ||
      at?.before !== dropAt?.before ||
      at?.after !== dropAt?.after
    ) {
      setDropAt(at);
    }
  };

  const endDrag = () => {
    setDragging(undefined);
    setDropAt(undefined);
  };

  /**
   * Puts the dragged clip where it's dropped. Into another category, it
   * leaves the one it came from, or with ⌥, it's in both.
   */
  const drop = (
    event: DragEvent,
    category: CharacterSoundClass,
    clip?: VoiceClip,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    endDrag();
    if (!dragging) {
      return;
    }
    const { from } = dragging;
    const dragged = clips.find((c) => c.file === dragging.clip.file);
    if (!dragged) {
      return;
    }
    const { before, after } = dropPlace(event, category, clip);
    const move: ClipMove = before ? { before } : after ? { after } : {};
    if (!before && !after) {
      const last = clips.filter((c) => c.categories.includes(category)).at(-1);
      if (last) {
        move.after = last.file;
      }
    }
    if (category !== from) {
      const categories = CHARACTER_SOUND_CLASSES.filter(
        (c) =>
          c === category ||
          (dragged.categories.includes(c) && (event.altKey || c !== from)),
      );
      if (categories.join() !== dragged.categories.join()) {
        move.categories = categories;
      }
    }
    const next = moveClip(clips, dragged.file, move);
    if (!next || next.every((c, i) => c === clips[i])) {
      return;
    }
    setMoved(next);
    run(
      move.categories
        ? `Moving ${dragged.file} to ${CATEGORY_INFO[category].label}…`
        : "Moving…",
      () => api.moveClip(id, dragged.file, move),
    );
  };

  const enabledCount = clips.filter((clip) => clip.enabled).length;
  const untranscribed = clips.filter((clip) => !clip.text).length;

  return (
    <section
      class="clips"
      onDragLeave={(event) =>
        !(event.currentTarget as Node).contains(event.relatedTarget as Node) &&
        setDropAt(undefined)
      }
    >
      <div class="clips__header">
        <h2>Voice lines</h2>
        <span class="muted">
          {enabledCount} enabled of {clips.length}
        </span>
        <span
          class="muted small"
          data-tip="Clips are files, so generating, trimming, enabling, deleting or moving one, or changing its text or categories, doesn't wait for Save"
        >
          · Clip changes save right away
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
        const inCategory = clips.filter((clip) =>
          clip.categories.includes(category),
        );
        const enabled = inCategory.filter((clip) => clip.enabled);
        const visible = inCategory.filter(matches);
        const isCollapsed = collapsed.has(category);
        const info = CATEGORY_INFO[category];
        const isDropTarget =
          dropAt?.category === category && !dropAt.before && !dropAt.after;
        return (
          <div
            key={category}
            class={`category ${isDropTarget ? "is-drop-target" : ""}`}
            onDragOver={(event) => dragOver(event, category)}
            onDrop={(event) => drop(event, category)}
          >
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
                    data-tip="Play every enabled clip in this category"
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
                  <div
                    key={clip.file}
                    class={[
                      "clip-slot",
                      dropAt?.category === category &&
                        dropAt.before === clip.file &&
                        "is-drop-before",
                      dropAt?.category === category &&
                        dropAt.after === clip.file &&
                        "is-drop-after",
                      dragging?.clip.file === clip.file &&
                        dragging.from === category &&
                        "is-dragged",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onDragOver={(event) => dragOver(event, category, clip)}
                    onDrop={(event) => drop(event, category, clip)}
                  >
                    <span
                      class="clip-slot__handle"
                      draggable
                      data-tip="Drag to put it in another place, or into another category to move it there (hold ⌥ to keep it in this one too)"
                      onDragStart={(event) => {
                        const row = (event.currentTarget as HTMLElement)
                          .nextElementSibling as HTMLElement;
                        const { left, top } = row.getBoundingClientRect();
                        event.dataTransfer!.effectAllowed = "copyMove";
                        event.dataTransfer!.setData("text/plain", clip.file);
                        event.dataTransfer!.setDragImage(
                          row,
                          Math.max(0, event.clientX - left),
                          event.clientY - top,
                        );
                        setDragging({ clip, from: category });
                      }}
                      onDragEnd={endDrag}
                    >
                      ⠿
                    </span>
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
                      onConvert={() =>
                        setFormAt({ category, basedOn: clip, convert: true })
                      }
                    />
                    {formAt?.category === category &&
                      formAt.basedOn?.file === clip.file &&
                      (formAt.convert ? (
                        <ConvertForm
                          id={id}
                          clip={clip}
                          onConvert={(request) =>
                            convert(clip, category, request)
                          }
                          onCancel={() => setFormAt(undefined)}
                        />
                      ) : (
                        <GenerateForm
                          initial={{
                            text: clip.text,
                            categories: clip.categories,
                            basedOn: clip.file,
                          }}
                          onGenerate={generate}
                          onCancel={() => setFormAt(undefined)}
                        />
                      ))}
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

function takes(count: number): string {
  return `${count} take${count > 1 ? "s" : ""}`;
}

/** Whether a clip was made with the voice changer, from another clip */
function isVoiceChanged(clip: VoiceClip): boolean {
  return (CONVERSION_MODELS as readonly string[]).includes(clip.model ?? "");
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
  onConvert,
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
  onConvert: () => void;
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
    clip.similarity !== undefined && `similarity ${clip.similarity}`,
    clip.removeBackgroundNoise && "background noise removed",
    clip.basedOn &&
      (isVoiceChanged(clip)
        ? `voice changed from ${clip.basedOn}`
        : `variation of ${clip.basedOn}`),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      class={`clip ${shown.enabled ? "is-enabled" : "is-disabled"} ${isFresh ? "is-fresh" : ""} ${take > 1 ? "is-retake" : ""}`}
    >
      <button
        class={`play ${playing ? "is-playing" : ""}`}
        data-tip="Play"
        onClick={() => toggle(api.audioUrl(id, clip.file), key)}
      >
        {playing ? "■" : "▶"}
      </button>
      <label
        class="switch"
        data-tip={
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
      <span class={`badge badge--${clip.source}`} data-tip={details}>
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
          data-tip="Generate variations of this line"
          disabled={!canGenerate}
          onClick={onVariations}
        >
          ↻
        </button>
        <button
          class="icon-button"
          data-tip="Voice changer: takes of this performance in the character's ElevenLabs voice, with its timing and delivery"
          disabled={!canGenerate}
          onClick={onConvert}
        >
          🎙
        </button>
        <button
          class="icon-button"
          data-tip="Replace the text with what speech-to-text hears"
          onClick={() =>
            run("Transcribing…", () => api.transcribe(id, clip.file))
          }
        >
          ✎
        </button>
        <button
          class="icon-button"
          data-tip="Trim the silence off the ends and set the loudness (replaces the file)"
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
          data-tip="Open in Ocenaudio. Save there, then play it here again."
          onClick={() => run("Opening…", () => api.openInEditor(id, clip.file))}
        >
          ↗
        </button>
        <button
          class="icon-button icon-button--danger"
          data-tip="Delete this clip and its audio file"
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
        data-tip={categories.map((c) => CATEGORY_INFO[c].label).join(", ")}
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
        <span class="muted small" data-tip="ElevenLabs bills by characters">
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

const VOICE_CHANGER_KEY = "characterEditorVoiceChanger";

/** ElevenLabs' defaults, but for the noise, since it's for rough recordings */
const DEFAULT_VOICE_CHANGER: ConvertRequest = {
  count: 3,
  model: "eleven_english_sts_v2",
  stability: 0.5,
  similarity: 0.75,
  removeBackgroundNoise: true,
};

const CONVERSION_MODEL_LABELS: Record<ConversionModel, string> = {
  eleven_english_sts_v2: "English",
  eleven_multilingual_sts_v2: "Multilingual",
};

/** The voice changer's settings, kept from the last time it was used */
function loadVoiceChanger(): ConvertRequest {
  try {
    const saved = JSON.parse(localStorage.getItem(VOICE_CHANGER_KEY) ?? "{}");
    const settings = { ...DEFAULT_VOICE_CHANGER, ...saved };
    return CONVERSION_MODELS.includes(settings.model)
      ? settings
      : DEFAULT_VOICE_CHANGER;
  } catch {
    return DEFAULT_VOICE_CHANGER;
  }
}

/** Seconds of audio at `url`, once the browser has read how long it is */
function useDuration(url: string): number | undefined {
  const [duration, setDuration] = useState<number>();
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : undefined),
    );
    audio.src = url;
    return () => audio.removeAttribute("src");
  }, [url]);
  return duration;
}

/** The voice changer: settings for performing `clip` again in the character's voice */
function ConvertForm({
  id,
  clip,
  onConvert,
  onCancel,
}: {
  id: string;
  clip: VoiceClip;
  onConvert: (request: ConvertRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [settings, setSettings] = useState(loadVoiceChanger);
  const [busy, setBusy] = useState(false);
  const duration = useDuration(api.audioUrl(id, clip.file));
  const change = (changes: Partial<ConvertRequest>) => {
    const next = { ...settings, ...changes };
    setSettings(next);
    try {
      localStorage.setItem(VOICE_CHANGER_KEY, JSON.stringify(next));
    } catch {}
  };

  const submit = async (event: Event) => {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await onConvert(settings);
    } finally {
      setBusy(false);
    }
  };

  // ElevenLabs bills the voice changer by the minute
  const credits =
    duration !== undefined
      ? Math.ceil((duration / 60) * 1000 * settings.count)
      : undefined;

  return (
    <form
      class="generate"
      onSubmit={submit}
      onKeyDown={(event) => event.key === "Escape" && onCancel()}
    >
      <div class="generate__title small">
        Voice changer: {clip.file} performed again in the character's voice,
        keeping its timing and delivery. It's trimmed and leveled before it's
        sent; the original stays. Takes come in disabled, with its text and
        categories.
      </div>
      <div class="convert__sliders">
        <Slider
          label="Stability"
          tip="Low: more emotional range, and more variety between takes, but it can drift from the voice. High: steadier, and flatter."
          value={settings.stability}
          reset={DEFAULT_VOICE_CHANGER.stability}
          ends={["Expressive", "Steady"]}
          onChange={(stability) => change({ stability })}
        />
        <Slider
          label="Similarity"
          tip="How closely it sticks to the voice. Very high can also copy noise or artifacts from the voice's own samples."
          value={settings.similarity}
          reset={DEFAULT_VOICE_CHANGER.similarity}
          ends={["Loose", "Close to the voice"]}
          onChange={(similarity) => change({ similarity })}
        />
      </div>
      <div class="generate__options">
        <label>
          Takes
          <select
            value={settings.count}
            onChange={(event) =>
              change({
                count: Number((event.target as HTMLSelectElement).value),
              })
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
          Model
          <select
            value={settings.model}
            onChange={(event) =>
              change({
                model: (event.target as HTMLSelectElement)
                  .value as ConversionModel,
              })
            }
          >
            {CONVERSION_MODELS.map((model) => (
              <option key={model} value={model} title={model}>
                {CONVERSION_MODEL_LABELS[model]}
              </option>
            ))}
          </select>
        </label>
        <label data-tip="ElevenLabs takes the room's noise out of the recording before changing the voice">
          <input
            type="checkbox"
            checked={settings.removeBackgroundNoise}
            onChange={(event) =>
              change({
                removeBackgroundNoise: (event.target as HTMLInputElement)
                  .checked,
              })
            }
          />
          Remove background noise
        </label>
        {credits !== undefined && (
          <span
            class="muted small"
            data-tip={`The voice changer costs 1,000 credits a minute. This clip is ${duration!.toFixed(1)} s, a little less once its silence is trimmed.`}
          >
            ≈ {credits} credits
          </span>
        )}
        <div class="generate__buttons">
          <button type="button" class="text-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" class="primary" disabled={busy} autoFocus>
            {busy ? "Changing…" : "Change voice"}
          </button>
        </div>
      </div>
    </form>
  );
}

import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { resolveLook } from "../../highrise/looks/BodyLook";
import { portraitUrl } from "../../highrise/looks/composeBody";
import { api } from "./api";
import { CharacterEntry, Voice } from "./apiTypes";
import { CharacterPanel } from "./CharacterPanel";
import { DraftStore } from "./drafts";

export interface Status {
  kind: "busy" | "error" | "done";
  message: string;
}

/**
 * Runs a change through the server and reloads everything afterwards, so
 * the page always shows what's on disk.
 */
export type RunAction = <T>(
  busyMessage: string,
  action: () => Promise<T>,
) => Promise<T | undefined>;

function selectedFromHash(): string {
  return decodeURIComponent(location.hash.slice(1));
}

export function App() {
  const [characters, setCharacters] = useState<CharacterEntry[]>();
  const [voices, setVoices] = useState<Voice[]>();
  const [voicesError, setVoicesError] = useState<string>();
  const [selected, setSelected] = useState(selectedFromHash());
  const [status, setStatus] = useState<Status>();
  const [busyCount, setBusyCount] = useState(0);
  const [, setDraftsVersion] = useState(0);
  const drafts = useRef<DraftStore>();
  drafts.current ??= new DraftStore(() => setDraftsVersion((n) => n + 1));

  const reload = useCallback(async () => {
    setCharacters(await api.characters());
  }, []);

  useEffect(() => {
    reload().catch((error) =>
      setStatus({ kind: "error", message: error.message }),
    );
    api
      .voices()
      .then(setVoices)
      .catch((error) => setVoicesError(error.message));
    const onHashChange = () => setSelected(selectedFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const run: RunAction = useCallback(async (busyMessage, action) => {
    setBusyCount((n) => n + 1);
    setStatus({ kind: "busy", message: busyMessage });
    try {
      const result = await action();
      await reload();
      setStatus(undefined);
      return result;
    } catch (error) {
      setStatus({ kind: "error", message: (error as Error).message });
      await reload().catch(() => {});
      return undefined;
    } finally {
      setBusyCount((n) => n - 1);
    }
  }, []);

  const entry = characters?.find((c) => c.id === selected) ?? characters?.[0];
  const unsavedIds = (characters ?? [])
    .filter(({ id, data }) => drafts.current!.unsaved(id, data).length > 0)
    .map(({ id }) => id);

  const save = async (ids: string[]) => {
    for (const id of ids) {
      const data = characters?.find((c) => c.id === id)?.data;
      if (!data) continue;
      const changes = drafts.current!.unsavedChanges(id, data);
      const name = drafts.current!.edited(id, data).name;
      const saved = await run(`Saving ${name}…`, () =>
        api.updateCharacter(id, changes),
      );
      if (!saved) {
        // The error's showing; leave the rest unsaved
        return;
      }
      drafts.current!.saved(id, saved);
    }
  };

  // The latest of everything, for the key and unload handlers
  const latest = useRef({ entry, unsavedIds, save });
  latest.current = { entry, unsavedIds, save };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const { entry, save } = latest.current;
      if (!entry || !(event.metaKey || event.ctrlKey)) {
        return;
      }
      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement;
      const typing =
        target.tagName === "TEXTAREA" ||
        (target.tagName === "INPUT" &&
          ["text", "search", ""].includes(
            (target as HTMLInputElement).type ?? "",
          ));
      if (key === "s") {
        event.preventDefault();
        // A text field being typed in has its edit in on blur
        (document.activeElement as HTMLElement | null)?.blur();
        setTimeout(() => save([entry.id]));
      } else if (!typing && (key === "z" || key === "y")) {
        event.preventDefault();
        const redo = key === "y" || event.shiftKey;
        drafts.current![redo ? "redo" : "undo"](entry.id, entry.data);
      }
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (latest.current.unsavedIds.length > 0) {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  const [collapsed, setCollapsed] = useCollapsedSidebar();

  useEffect(() => {
    document.title = `${unsavedIds.length > 0 ? "• " : ""}Character Editor`;
  }, [unsavedIds.length]);

  return (
    <div class={`editor ${collapsed ? "is-collapsed" : ""}`}>
      <nav class="sidebar">
        <div class="sidebar__top">
          <h1>Characters</h1>
          <button
            class="sidebar__toggle"
            title={collapsed ? "Show the names" : "Fold the list away"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>
        {characters?.map(({ id, data: disk }) => {
          const data = drafts.current!.edited(id, disk);
          const unsaved = unsavedIds.includes(id);
          const enabled = data.clips.filter((clip) => clip.enabled).length;
          return (
            <a
              key={id}
              href={`#${id}`}
              title={data.name}
              class={`sidebar__item ${entry?.id === id ? "is-selected" : ""}`}
            >
              <img src={portraitUrl(resolveLook(data.look), { scale: 60 })} />
              <span class="sidebar__name">
                {data.name}
                {unsaved && (
                  <span class="unsaved-dot" title="Unsaved changes" />
                )}
              </span>
              <span class="sidebar__count" title="Enabled clips / all clips">
                {enabled}/{data.clips.length}
              </span>
            </a>
          );
        })}
      </nav>
      <main class="main">
        {!characters && !status && <p class="muted">Loading…</p>}
        {entry && (
          <CharacterPanel
            key={entry.id}
            entry={entry}
            voices={voices}
            voicesError={voicesError}
            run={run}
            drafts={drafts.current}
            onSave={() => save([entry.id])}
            onSaveAll={() => save(unsavedIds)}
            unsavedCount={unsavedIds.length}
          />
        )}
      </main>
      {status && (
        <div
          class={`status status--${status.kind}`}
          onClick={() => status.kind !== "busy" && setStatus(undefined)}
        >
          {status.kind === "busy" && busyCount > 0 && <span class="spinner" />}
          <span class="status__message">{status.message}</span>
          {status.kind === "error" && <span class="status__close">×</span>}
        </div>
      )}
    </div>
  );
}

/** Where whether the sidebar's folded is remembered */
const COLLAPSED_KEY = "characterEditorSidebarCollapsed";

/**
 * Whether the character list is folded down to their pictures: as it was
 * left, else folded when the window's narrow
 */
function useCollapsedSidebar(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY);
      if (saved !== null) {
        return saved === "true";
      }
    } catch {}
    return window.innerWidth < 1100;
  });
  const set = (next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch {}
  };
  return [collapsed, set];
}

import { useCallback, useEffect, useState } from "preact/hooks";
import { ImageName, RESOURCES } from "../../../resources/resources";
import { api } from "./api";
import { CharacterEntry, Voice } from "./apiTypes";
import { CharacterPanel } from "./CharacterPanel";

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

  return (
    <div class="editor">
      <nav class="sidebar">
        <h1>Characters</h1>
        {characters?.map(({ id, data }) => {
          const enabled = data.clips.filter((clip) => clip.enabled).length;
          return (
            <a
              key={id}
              href={`#${id}`}
              class={`sidebar__item ${entry?.id === id ? "is-selected" : ""}`}
            >
              <img src={RESOURCES.images[data.textures.head as ImageName]} />
              <span class="sidebar__name">{data.name}</span>
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

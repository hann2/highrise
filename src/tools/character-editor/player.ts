/** One sound at a time: playing a clip stops the one before */
let current: HTMLAudioElement | undefined;
let currentKey: string | undefined;
const listeners = new Set<() => void>();

export function playingKey(): string | undefined {
  return currentKey;
}

export function onPlayingChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setCurrent(audio: HTMLAudioElement | undefined, key?: string) {
  current = audio;
  currentKey = key;
  listeners.forEach((listener) => listener());
}

export function stop() {
  current?.pause();
  setCurrent(undefined);
}

/**
 * Plays `url`, or stops it if it's the one playing. Resolves when it stops:
 * true if it played to the end, false if it was stopped or failed.
 */
export function toggle(url: string, key: string = url): Promise<boolean> {
  if (currentKey === key) {
    stop();
    return Promise.resolve(false);
  }
  stop();
  const audio = new Audio(url);
  setCurrent(audio, key);
  return new Promise((resolve) => {
    const done = (finished: boolean) => {
      if (current === audio) {
        setCurrent(undefined);
      }
      resolve(finished);
    };
    audio.addEventListener("ended", () => done(true));
    audio.addEventListener("pause", () => done(false));
    audio.addEventListener("error", () => done(false));
    audio.play().catch(() => done(false));
  });
}

/** Plays clips one after another, until one is stopped */
export async function playInTurn(items: { url: string; key: string }[]) {
  for (const { url, key } of items) {
    if (!(await toggle(url, key))) {
      return;
    }
  }
}

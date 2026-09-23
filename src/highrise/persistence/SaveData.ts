/**
 * Everything that persists between runs, in one versioned localStorage entry.
 *
 * Reading is tolerant: missing, corrupt or partly wrong data falls back to the
 * defaults field by field, and nothing here ever throws (localStorage itself
 * can throw, e.g. when storage is disabled). The older standalone keys
 * (`tutorialComplete`, `muted`, `volume`, `graphicsQuality`) are left where
 * they are.
 */

const STORAGE_KEY = "highriseSaveData";
export const SAVE_DATA_VERSION = 1;
/** How many past runs are kept */
export const MAX_SAVED_RUNS = 20;

export type RunOutcome = "victory" | "died" | "quit";

/** What happened in one run, as shown on the run summary screen */
export interface RunSummary {
  /** When the run ended, in ms since the epoch */
  endedAt: number;
  outcome: RunOutcome;
  /** Name of the character the run started with */
  character: string;
  /** The highest floor the run reached */
  floorReached: number;
  /** Enemy type name → how many died */
  kills: Record<string, number>;
  quartersCollected: number;
  quartersSpent: number;
  /** Seconds of (unpaused) play */
  timeSeconds: number;
  /** Enemy type that killed the last party member, if the party died */
  causeOfDeath?: string;
  /** Names of the upgrades taken, in order */
  upgrades: string[];
  /** Names of the characters unlocked during the run */
  charactersUnlocked: string[];
}

export interface SaveData {
  version: number;
  /** Names of characters unlocked for play */
  unlockedCharacters: string[];
  /** The most recent runs, oldest first, at most MAX_SAVED_RUNS */
  runs: RunSummary[];
  /** Number of runs ever finished, including ones dropped from `runs` */
  totalRuns: number;
  /** The highest floor any run has reached */
  bestFloor: number;
}

export function defaultSaveData(): SaveData {
  return {
    version: SAVE_DATA_VERSION,
    unlockedCharacters: [],
    runs: [],
    totalRuns: 0,
    bestFloor: 0,
  };
}

/** Reads the save data, falling back to defaults for anything missing or broken. */
export function loadSaveData(): SaveData {
  let raw: unknown;
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    raw = text == null ? undefined : JSON.parse(text);
  } catch {
    raw = undefined;
  }
  return parseSaveData(raw);
}

/** Writes the save data. Returns false if it couldn't be stored. */
export function saveSaveData(data: SaveData): boolean {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, version: SAVE_DATA_VERSION }),
    );
    return true;
  } catch {
    return false;
  }
}

/** Loads, changes and saves the save data in one go. */
export function updateSaveData(update: (data: SaveData) => void): SaveData {
  const data = loadSaveData();
  update(data);
  saveSaveData(data);
  return data;
}

/** Adds a finished run to the history and updates the records. */
export function recordRun(run: RunSummary): SaveData {
  return updateSaveData((data) => {
    data.runs.push(run);
    data.runs = data.runs.slice(-MAX_SAVED_RUNS);
    data.totalRuns += 1;
    data.bestFloor = Math.max(data.bestFloor, run.floorReached);
    for (const name of run.charactersUnlocked) {
      if (!data.unlockedCharacters.includes(name)) {
        data.unlockedCharacters.push(name);
      }
    }
  });
}

export function isCharacterUnlocked(name: string): boolean {
  return loadSaveData().unlockedCharacters.includes(name);
}

export function unlockCharacter(name: string): void {
  updateSaveData((data) => {
    if (!data.unlockedCharacters.includes(name)) {
      data.unlockedCharacters.push(name);
    }
  });
}

/**
 * Turns whatever was stored into valid SaveData. Data from a newer version
 * than this code knows about is read the same way, keeping what it can.
 */
export function parseSaveData(raw: unknown): SaveData {
  const data = defaultSaveData();
  if (!isObject(raw)) {
    return data;
  }
  // Migrations from older versions go here, keyed on raw.version
  data.unlockedCharacters = stringArray(raw.unlockedCharacters);
  data.runs = Array.isArray(raw.runs)
    ? raw.runs
        .map(parseRunSummary)
        .filter((run): run is RunSummary => run !== undefined)
        .slice(-MAX_SAVED_RUNS)
    : [];
  data.totalRuns = Math.max(nonNegative(raw.totalRuns), data.runs.length);
  data.bestFloor = Math.max(
    nonNegative(raw.bestFloor),
    ...data.runs.map((run) => run.floorReached),
  );
  return data;
}

function parseRunSummary(raw: unknown): RunSummary | undefined {
  if (!isObject(raw)) {
    return undefined;
  }
  const outcome: RunOutcome =
    raw.outcome === "victory" || raw.outcome === "died" ? raw.outcome : "quit";
  const kills: Record<string, number> = {};
  if (isObject(raw.kills)) {
    for (const [name, count] of Object.entries(raw.kills)) {
      kills[name] = nonNegative(count);
    }
  }
  return {
    endedAt: nonNegative(raw.endedAt),
    outcome,
    character: typeof raw.character === "string" ? raw.character : "",
    floorReached: nonNegative(raw.floorReached),
    kills,
    quartersCollected: nonNegative(raw.quartersCollected),
    quartersSpent: nonNegative(raw.quartersSpent),
    timeSeconds: nonNegative(raw.timeSeconds),
    causeOfDeath:
      typeof raw.causeOfDeath === "string" ? raw.causeOfDeath : undefined,
    upgrades: stringArray(raw.upgrades),
    charactersUnlocked: stringArray(raw.charactersUnlocked),
  };
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function stringArray(x: unknown): string[] {
  return Array.isArray(x)
    ? x.filter((s): s is string => typeof s === "string")
    : [];
}

function nonNegative(x: unknown): number {
  return typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0;
}

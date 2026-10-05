import { CharacterData } from "../../highrise/characters/CharacterData";
import { resolveLook } from "../../highrise/looks/BodyLook";
import { CharacterChanges } from "./apiTypes";

/**
 * The parts of a character the editor keeps as a draft until it's saved.
 * Clips aren't: they're files, and generating, trimming, enabling or deleting
 * one changes the disk right away.
 */
export const DRAFT_FIELDS = [
  "name",
  "description",
  "look",
  "stats",
  "startingWeapons",
  "voice",
] as const;
export type DraftField = (typeof DRAFT_FIELDS)[number];

export const FIELD_LABELS: Record<DraftField, string> = {
  name: "name",
  description: "description",
  look: "look",
  stats: "stats",
  startingWeapons: "starting weapons",
  voice: "voice",
};

/** Every draft field's value, as one step of undo */
type Values = Required<Pick<CharacterChanges, DraftField>>;

interface Draft {
  /** The fields edited, with their new values (some may be back to what's on disk) */
  changes: CharacterChanges;
  undo: Values[];
  redo: Values[];
  lastEdit: number;
  lastGroup?: string;
}

/** Edits of the same thing closer together than this are one step of undo */
const UNDO_GROUP = 800;
/** Where drafts are kept, so a reload or a crash doesn't lose them */
const STORAGE_KEY = "characterEditorDrafts";

/** Equal as JSON, whatever order the keys are in */
function same(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null ||
    Array.isArray(a) !== Array.isArray(b)
  ) {
    return false;
  }
  const keys = (o: object) =>
    Object.keys(o).filter((k) => (o as any)[k] !== undefined);
  const ak = keys(a);
  const bk = keys(b);
  return (
    ak.length === bk.length &&
    ak.every((k) => same((a as any)[k], (b as any)[k]))
  );
}

/** A draft field's value as saved */
function diskValue(data: CharacterData, field: DraftField): unknown {
  switch (field) {
    case "look":
      return resolveLook(data.look);
    case "voice":
      return data.voice ?? null;
    default:
      return data[field];
  }
}

/**
 * Unsaved edits to every character, with undo and redo per character. Kept
 * in memory across switching characters, and in localStorage across reloads.
 */
export class DraftStore {
  private drafts = new Map<string, Draft>();

  constructor(private onChange: () => void) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      for (const [id, changes] of Object.entries(saved)) {
        this.drafts.set(id, this.fresh(changes as CharacterChanges));
      }
    } catch {}
  }

  private fresh(changes: CharacterChanges = {}): Draft {
    return { changes, undo: [], redo: [], lastEdit: 0 };
  }

  private draft(id: string): Draft {
    let draft = this.drafts.get(id);
    if (!draft) {
      draft = this.fresh();
      this.drafts.set(id, draft);
    }
    return draft;
  }

  /** The character as it is in the editor: what's on disk with the edits on top */
  edited(id: string, data: CharacterData): CharacterData {
    const { voice, ...changes } = this.drafts.get(id)?.changes ?? {};
    const edited = { ...data, ...changes };
    if (voice !== undefined) {
      edited.voice = voice ?? undefined;
    }
    return edited;
  }

  /** The fields whose edits differ from what's on disk */
  unsaved(id: string, data: CharacterData): DraftField[] {
    const changes = this.drafts.get(id)?.changes ?? {};
    return DRAFT_FIELDS.filter(
      (field) =>
        field in changes && !same(changes[field], diskValue(data, field)),
    );
  }

  /** The unsaved edits, as the changes to send to the server */
  unsavedChanges(id: string, data: CharacterData): CharacterChanges {
    const changes = this.drafts.get(id)?.changes ?? {};
    return Object.fromEntries(
      this.unsaved(id, data).map((field) => [field, changes[field]]),
    );
  }

  private values(id: string, data: CharacterData): Values {
    const changes = this.drafts.get(id)?.changes ?? {};
    return Object.fromEntries(
      DRAFT_FIELDS.map((field) => [
        field,
        field in changes ? changes[field] : diskValue(data, field),
      ]),
    ) as Values;
  }

  /**
   * Changes the draft. Edits in the same `group` (a slider being dragged,
   * say) close together in time are one step of undo.
   */
  edit(id: string, data: CharacterData, changes: CharacterChanges, group = "") {
    const draft = this.draft(id);
    const now = performance.now();
    if (group !== draft.lastGroup || now - draft.lastEdit > UNDO_GROUP) {
      draft.undo.push(this.values(id, data));
    }
    draft.lastEdit = now;
    draft.lastGroup = group;
    draft.redo = [];
    draft.changes = { ...draft.changes, ...changes };
    this.changed();
  }

  canUndo(id: string) {
    return (this.drafts.get(id)?.undo.length ?? 0) > 0;
  }

  canRedo(id: string) {
    return (this.drafts.get(id)?.redo.length ?? 0) > 0;
  }

  undo(id: string, data: CharacterData) {
    this.step(id, data, "undo", "redo");
  }

  redo(id: string, data: CharacterData) {
    this.step(id, data, "redo", "undo");
  }

  private step(
    id: string,
    data: CharacterData,
    from: "undo" | "redo",
    to: "undo" | "redo",
  ) {
    const draft = this.draft(id);
    const values = draft[from].pop();
    if (values) {
      draft[to].push(this.values(id, data));
      // Fields as saved drop out, so they don't show as edits once saved
      draft.changes = Object.fromEntries(
        DRAFT_FIELDS.filter(
          (field) => !same(values[field], diskValue(data, field)),
        ).map((field) => [field, values[field]]),
      );
      draft.lastEdit = 0;
      this.changed();
    }
  }

  /** Throws away the unsaved edits; Undo brings them back */
  revert(id: string, data: CharacterData) {
    const draft = this.draft(id);
    draft.undo.push(this.values(id, data));
    draft.redo = [];
    draft.changes = {};
    draft.lastEdit = 0;
    this.changed();
  }

  /** After saving: the edits that are on disk now aren't drafts any more */
  saved(id: string, data: CharacterData) {
    const draft = this.drafts.get(id);
    if (draft) {
      const unsaved = this.unsavedChanges(id, data);
      draft.changes = unsaved;
      this.changed();
    }
  }

  private changed() {
    try {
      const stored: Record<string, CharacterChanges> = {};
      for (const [id, draft] of this.drafts) {
        if (Object.keys(draft.changes).length > 0) {
          stored[id] = draft.changes;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {}
    this.onChange();
  }
}

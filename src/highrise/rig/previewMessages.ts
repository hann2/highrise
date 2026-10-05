import { PlayerStats } from "../human/PlayerStats";
import { PartialLook } from "../looks/BodyLook";

/** What the character editor's game preview shows its character doing */
export const PREVIEW_MODES = ["walk", "armed", "shoot"] as const;
export type PreviewMode = (typeof PREVIEW_MODES)[number];

/** The editor to `PreviewScene`: who to show (the unsaved draft), and how */
export interface PreviewShow {
  type: "previewShow";
  look: PartialLook;
  /** Weapon names, as in the character's JSON */
  startingWeapons: string[];
  stats: Partial<PlayerStats>;
  mode: PreviewMode;
}

/** `PreviewScene` to the editor: it's booted and listening */
export interface PreviewReady {
  type: "previewReady";
}

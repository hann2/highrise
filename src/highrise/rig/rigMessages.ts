import type { RigMode } from "./RigTestScene";

/*
 * How a page drives the rig scene in an iframe (`?scene=rig&embed`, as the
 * gun browser does): it posts what to show and the rig posts back where its
 * animations are. Same origin only.
 */

/** How the camera frames the lineup: all of it, or close on the first gun */
export type RigView = "lineup" | "gun";

/** The page to the rig: what to show. Anything that's changed is changed. */
export interface RigShow {
  type: "rigShow";
  /** Gun names, as in their stats */
  guns: string[];
  /** Who holds them, by name */
  character: string;
  leftHanded: boolean;
  mode: RigMode;
  /** 1 is full speed */
  speed: number;
  paused: boolean;
  /** Mark the points on the guns and ring the hands (`RigOverlay`) */
  points: boolean;
  view: RigView;
  muted: boolean;
}

/** The page to the rig: run one frame, while paused */
export interface RigStep {
  type: "rigStep";
}

/** The page to the rig: hold every gun's animation this far through, 0 to 1, while paused */
export interface RigSeek {
  type: "rigSeek";
  progress: number;
}

/** The page to the rig: start the demonstration (or animation) over */
export interface RigRestart {
  type: "rigRestart";
}

export type RigCommand = RigShow | RigStep | RigSeek | RigRestart;

/** The rig to the page: it's booted and listening */
export interface RigReady {
  type: "rigReady";
}

/** The rig to the page, a few times a second: how the first gun's doing */
export interface RigStatus {
  type: "rigStatus";
  /** The animation playing, if any */
  animation?: string;
  /** How far through it, 0 to 1 */
  progress: number;
  /** Seconds it takes, as it's stretched */
  duration: number;
  ammo: number;
  capacity: number;
  reloading: boolean;
}

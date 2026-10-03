import type { VNode } from "preact";
import Game from "../../Game";
import { KeyCode } from "../../io/Keys";

/** Context passed to each panel for rendering and event handling. */
export interface StatsPanelContext {
  /** The game instance for accessing entities, world, renderer, etc. */
  game: Game;
  /** Smoothed FPS from frame timing */
  fps: number;
  /** The frame rate the game is aiming for */
  targetFps: number;
  /** The display's refresh rate, as measured */
  refreshRate: number;
}

/**
 * Interface for stats overlay panels.
 * Each panel is self-contained with its own rendering, data fetching, and input handling.
 */
export interface StatsPanel {
  /** Unique identifier for the panel */
  id: string;

  /** Render the panel content */
  render(ctx: StatsPanelContext): VNode | null;

  /** Called when the panel becomes the visible one */
  onShow?(): void;

  /** Called when the panel stops being the visible one */
  onHide?(): void;

  /**
   * Optional keyboard handler.
   * @returns true if the key was handled, false otherwise
   */
  onKeyDown?(
    ctx: StatsPanelContext,
    key: KeyCode,
    event: KeyboardEvent,
  ): boolean;
}

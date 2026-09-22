import type { VNode } from "preact";
import Game from "../../Game";
import { KeyCode } from "../../io/Keys";

/** Context passed to each panel for rendering and event handling. */
export interface StatsPanelContext {
  /** The game instance for accessing entities, world, renderer, etc. */
  game: Game;
  /** Smoothed FPS from frame timing */
  fps: number;
  /** Screen refresh rate FPS */
  fps2: number;
}

/**
 * Interface for stats overlay panels.
 * Each panel is self-contained with its own rendering, data fetching, and input handling.
 */
export interface StatsPanel {
  /** Unique identifier for the panel */
  id: string;

  /** Render the panel content */
  render(ctx: StatsPanelContext): VNode;

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

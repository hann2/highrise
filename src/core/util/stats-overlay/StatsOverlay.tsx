import type { VNode } from "preact";
import Entity, { GameEventMap } from "../../entity/Entity";
import { on } from "../../entity/handler";
import Game from "../../Game";
import ReactEntity from "../../ReactEntity";
import { profile } from "../Profiler";
import "./StatsOverlay.css";
import type { StatsPanel, StatsPanelContext } from "./StatsPanel";

const SMOOTHING = 0.95;
const RENDER_THROTTLE = 3; // Only re-render every N frames
const CYCLE_KEY = "Backslash";

/**
 * Stats overlay entity that displays debug/performance information in the
 * corner of the screen. Backslash cycles through the panels (shift for
 * backwards); each panel is self-contained with its own rendering, data
 * fetching, and keyboard handling.
 *
 * @example
 * ```typescript
 * game.addEntity(new StatsOverlay([
 *   createLeanPanel(),
 *   createProfilerPanel(),
 *   createRenderPanel(),
 * ]));
 * ```
 */
export class StatsOverlay extends ReactEntity implements Entity {
  persistenceLevel = 100;
  pausable = false;

  private panels: StatsPanel[];
  private activePanelIndex: number = -1; // -1 = closed

  private averageDuration: number = 0;
  private lastUpdate = performance.now();
  private frameCounter = 0;

  /**
   * @param panels The panels to cycle through, in order
   * @param initialPanel The id of the panel to start on, or undefined to start closed
   */
  constructor(panels: StatsPanel[], initialPanel?: string) {
    super(() => this.renderContent(), false); // autoRender = false for throttling
    this.panels = panels;
    this.activePanelIndex = panels.findIndex((p) => p.id === initialPanel);
  }

  get activePanel(): StatsPanel | undefined {
    return this.panels[this.activePanelIndex];
  }

  private renderContent(): VNode | null {
    const panel = this.activePanel;
    if (!panel) {
      return null;
    }
    const ctx = this.getContext();

    return (
      <div className="stats-overlay">
        <div className="stats-overlay__header">
          <span>
            FPS: {ctx.fps} ({ctx.fps2})
          </span>
        </div>
        {panel.render(ctx)}
      </div>
    );
  }

  private getContext(): StatsPanelContext {
    return {
      game: this.game,
      fps: Math.ceil(1000 / this.averageDuration),
      fps2: this.game.getScreenFps(),
    };
  }

  private cycleMode(direction: 1 | -1) {
    // -1 = closed, 0..n-1 = panel indices
    const total = this.panels.length + 1; // +1 for closed state
    this.setActivePanel(
      ((this.activePanelIndex + 1 + direction + total) % total) - 1,
    );
  }

  private setActivePanel(index: number) {
    this.activePanel?.onHide?.();
    this.activePanelIndex = index;
    this.activePanel?.onShow?.();
    // Immediately render to show the change (don't wait for throttle)
    this.reactRender();
  }

  @on("add")
  onAdd(data: { game: Game }) {
    this.averageDuration = 1000 / 120;
    this.activePanel?.onShow?.();
    super.onAdd(data);
  }

  @on("destroy")
  onDestroy(data: { game: Game }) {
    this.activePanel?.onHide?.();
    super.onDestroy(data);
  }

  @on("render")
  @profile
  onRender(_dt: number) {
    const now = performance.now();
    const duration = now - this.lastUpdate;
    this.averageDuration =
      SMOOTHING * this.averageDuration + (1.0 - SMOOTHING) * duration;
    this.lastUpdate = now;

    // Throttle re-renders (20fps is plenty for a stats display)
    this.frameCounter++;
    if (
      this.activePanelIndex >= 0 &&
      this.frameCounter % RENDER_THROTTLE === 0
    ) {
      this.reactRender();
    }
  }

  @on("keyDown")
  onKeyDown({ key, event }: GameEventMap["keyDown"]) {
    if (key === CYCLE_KEY) {
      this.cycleMode(event.shiftKey ? -1 : 1);
      return;
    }

    // Delegate to active panel
    this.activePanel?.onKeyDown?.(this.getContext(), key, event);
  }
}

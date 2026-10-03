import type { StatsPanel } from "./StatsPanel";

/** Creates a panel with nothing under the FPS header: just the frame rate, for players. */
export function createFpsPanel(): StatsPanel {
  return {
    id: "fps",
    render: () => null,
  };
}

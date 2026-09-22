import type { StatsPanel } from "./StatsPanel";

/** Creates a one-line panel with just the object counts under the FPS header. */
export function createLeanPanel(): StatsPanel {
  return {
    id: "lean",
    render: ({ game }) => (
      <div className="stats-overlay__subheader">
        Bodies: {game.world.bodies.length} | Entities: {game.entities.all.size}{" "}
        | Sprites: {game.renderer.spriteCount}
      </div>
    ),
  };
}

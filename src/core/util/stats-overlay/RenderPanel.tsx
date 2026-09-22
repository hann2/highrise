import type { StatsPanel } from "./StatsPanel";

/** Creates a panel showing renderer stats (sprite count, canvas size, resolution). */
export function createRenderPanel(): StatsPanel {
  return {
    id: "render",
    render: (ctx) => {
      const renderer = ctx.game.renderer;
      const pixiRenderer = renderer.app.renderer;
      return (
        <>
          <div className="stats-overlay__subheader">
            Sprites: {renderer.spriteCount}
          </div>
          <div className="stats-overlay__subheader">
            Canvas: {Math.round(renderer.getWidth())}x
            {Math.round(renderer.getHeight())} @ {pixiRenderer.resolution}x
          </div>
          <div className="stats-overlay__subheader">
            Renderer: {pixiRenderer.name}
          </div>
        </>
      );
    },
  };
}

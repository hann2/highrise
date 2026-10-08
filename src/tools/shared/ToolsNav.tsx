import { SCENES, TOOLS } from "./toolList";
import "./tools-nav.css";

/**
 * The bar across the top of every tool: the tools page, each tool (the one
 * this is marked), and the game's test scenes in a menu
 */
export function ToolsNav({ current }: { current?: string }) {
  return (
    <header class="tools-nav">
      <a class="tools-nav__home" href="/tools/" data-tip="Every tool and scene">
        Highrise tools
      </a>
      {TOOLS.map((tool) => (
        <a
          key={tool.href}
          href={tool.href}
          class={`tools-nav__link ${tool.name === current ? "is-current" : ""}`}
          data-tip={tool.about}
          data-tip-placement="bottom"
        >
          {tool.name}
        </a>
      ))}
      <details class="tools-nav__scenes">
        <summary>Scenes</summary>
        <div class="tools-nav__menu">
          {SCENES.map((scene) => (
            <a key={scene.href} href={scene.href} target="_blank">
              <span>{scene.name}</span>
              <span class="muted small">{scene.about}</span>
            </a>
          ))}
        </div>
      </details>
    </header>
  );
}

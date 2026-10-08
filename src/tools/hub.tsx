import { render } from "preact";
import "./shared/tools.css";
import "./hub.css";
import { SCENES, TOOLS, ToolLink } from "./shared/toolList";
import { startTooltips } from "./shared/tooltips";
import { ToolsNav } from "./shared/ToolsNav";

/** The tools page (/tools/, development only): every tool and test scene */
function Hub() {
  return (
    <>
      <ToolsNav />
      <main class="hub">
        <h1>Tools</h1>
        <Links links={TOOLS} />
        <h1>Scenes</h1>
        <p class="muted small hub__note">
          The game, started in one of its test scenes. Most take more in the
          URL: see each scene's class.
        </p>
        <Links links={SCENES} />
      </main>
    </>
  );
}

function Links({ links }: { links: readonly ToolLink[] }) {
  return (
    <div class="hub__links">
      {links.map((link) => (
        <a key={link.href} class="hub__link" href={link.href}>
          <span class="hub__name">{link.name}</span>
          <span class="muted">{link.about}</span>
          <code class="small muted">{link.href}</code>
        </a>
      ))}
    </div>
  );
}

startTooltips(document.body);
render(<Hub />, document.getElementById("root")!);

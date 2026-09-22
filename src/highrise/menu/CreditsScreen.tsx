import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { CREDITS_TEXT } from "./Credits";
import MainMenu from "./MainMenu";
import "./menu.css";

const SCROLL_SPEED = 0.8; // pixels per frame

export default class CreditsScreen extends ReactEntity implements Entity {
  y = 0;
  creditsEl: HTMLDivElement | null = null;

  constructor() {
    super(() => this.renderContent());
  }

  renderContent() {
    return (
      <div className="menu-screen">
        <div
          className="credits"
          ref={(el) => {
            this.creditsEl = el;
          }}
          style={{ transform: `translateY(${this.y}px)` }}
        >
          {CREDITS_TEXT.split("\n").map(renderLine)}
        </div>
      </div>
    );
  }

  @on("add")
  onAdd(data: { game: Game }) {
    this.y = data.game.renderer.getHeight();
    super.onAdd(data);
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "Escape") {
      this.backToMenu();
    }
  }

  backToMenu() {
    this.game.addEntity(new MainMenu());
    this.destroy();
  }

  @on("render")
  onRender(dt: number) {
    let speed = SCROLL_SPEED;
    if (this.game.io.isKeyDown("Space")) {
      speed *= 10;
    }
    this.y -= speed;

    super.onRender(dt);

    if (this.creditsEl && this.creditsEl.getBoundingClientRect().bottom < 0) {
      this.backToMenu();
    }
  }
}

/** Lines starting with # are headings; "label—name" lines get split into two columns. */
function renderLine(line: string, i: number) {
  const isHeading = line[0] === "#";
  if (isHeading) {
    line = line.substring(1);
  }
  const headingClass = isHeading ? "credits__heading" : "";
  const parts = line.split("—");

  if (parts.length == 2) {
    return [
      <div key={`${i}-label`} className={`credits__label ${headingClass}`}>
        {parts[0]}
      </div>,
      <div key={`${i}-name`} className={`credits__name ${headingClass}`}>
        {parts[1]}
      </div>,
    ];
  } else {
    return (
      <div key={i} className={`credits__line ${headingClass}`}>
        {line || " "}
      </div>
    );
  }
}

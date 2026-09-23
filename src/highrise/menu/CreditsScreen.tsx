import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import { CREDITS_TEXT } from "./Credits";
import "./menu.css";

const SCROLL_SPEED = 0.8; // pixels per frame

/**
 * The credits, scrolling up over a darkened screen. Opened over the title
 * screen or the pause menu, which ignore input while it's up (see
 * `isCreditsOpen`) and get it back when it closes.
 */
export default class CreditsScreen extends ReactEntity implements Entity {
  pausable = false;
  y = 0;
  creditsEl: HTMLDivElement | null = null;
  private closing = false;

  constructor(persistenceLevel: Persistence) {
    super(() => this.renderContent());
    this.persistenceLevel = persistenceLevel;
  }

  renderContent() {
    return (
      <div className="menu-screen">
        <div className="credits__background" />
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
    if (key === "Escape" || key === "Backspace") {
      this.close();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    if (button === ControllerButton.B || button === ControllerButton.BACK) {
      this.close();
    }
  }

  /**
   * Closes on the next frame rather than right away, so that the key press
   * that closes it still finds it open in the screen underneath's handlers.
   */
  close() {
    this.closing = true;
  }

  @on("render")
  onRender(dt: number) {
    if (this.closing) {
      this.destroy();
      return;
    }

    let speed = SCROLL_SPEED;
    if (this.game.io.isKeyDown("Space")) {
      speed *= 10;
    }
    this.y -= speed;

    super.onRender(dt);

    if (this.creditsEl && this.creditsEl.getBoundingClientRect().bottom < 0) {
      this.close();
    }
  }
}

/** Whether the credits are rolling, in which case the screen underneath ignores input */
export function isCreditsOpen(game: Game): boolean {
  return game.entities
    .getByConstructor(CreditsScreen)
    .some((screen) => !screen.isDestroyed);
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
        {line || " "}
      </div>
    );
  }
}

import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import ReactEntity from "../../core/ReactEntity";
import { PreloaderProgress } from "../../core/resources/Preloader";
import { clamp, smoothStep } from "../../core/util/MathUtil";
import "../menu/menu.css";
import "./loading-screen.css";

const TITLE_FADE_IN_TIME = 0.6;
const BARS_FADE_OUT_TIME = 0.4;

/**
 * What's on screen while the game loads. Nothing until the fonts are in, then
 * the title, drawn exactly where `MainMenu` draws it so the menu can take over
 * without a seam, and a loading bar each for images and sounds where the menu's
 * "Press Enter to start" goes.
 */
export default class LoadingScreen extends ReactEntity implements Entity {
  pausable = false;

  /** Seconds since the fonts finished loading, or undefined before that */
  private timeSinceFonts: number | undefined = undefined;
  private barsOpacity = 1;

  constructor(private progress: PreloaderProgress) {
    super(() => this.renderContent());
  }

  private get fontsLoaded() {
    const { loaded, total } = this.progress.fonts;
    return total > 0 && loaded >= total;
  }

  renderContent() {
    if (this.timeSinceFonts === undefined) {
      return null;
    }
    const fadeIn = smoothStep(this.timeSinceFonts / TITLE_FADE_IN_TIME);
    return (
      <div className="menu-screen">
        <div className="menu-title" style={{ opacity: fadeIn }}>
          HIGHRISE
        </div>
        <div
          className="loading-bars"
          style={{ opacity: fadeIn * this.barsOpacity }}
        >
          <LoadingBar label="Images" {...this.progress.images} />
          <LoadingBar label="Sounds" {...this.progress.sounds} />
        </div>
      </div>
    );
  }

  @on("render")
  onRender(dt: number) {
    if (this.timeSinceFonts !== undefined) {
      this.timeSinceFonts += dt;
    } else if (this.fontsLoaded) {
      this.timeSinceFonts = 0;
    }
    super.onRender(dt);
  }

  /** Lets the title finish fading in, then fades the bars out. */
  async finish() {
    // Loading can finish before the title is all the way in, e.g. from cache
    while ((this.timeSinceFonts ?? 0) < TITLE_FADE_IN_TIME) {
      await this.wait();
    }
    await this.wait(BARS_FADE_OUT_TIME, (_, t) => {
      this.barsOpacity = smoothStep(1 - t);
    });
  }
}

function LoadingBar({
  label,
  loaded,
  total,
}: {
  label: string;
  loaded: number;
  total: number;
}) {
  const fraction = total > 0 ? clamp(loaded / total, 0, 1) : 0;
  return (
    <div className="loading-bar">
      <div className="loading-bar__label">
        <span>{label}</span>
        <span>{Math.floor(fraction * 100)}%</span>
      </div>
      <div className="loading-bar__track">
        <div
          className="loading-bar__fill"
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
    </div>
  );
}

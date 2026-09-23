import Entity from "../../core/entity/Entity";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import Interactable, {
  InteractPromptContent,
} from "../environment/Interactable";
import Human from "../human/Human";
import "./hud.css";
import InteractHighlight from "./InteractHighlight";

/**
 * Says what the nearest thing the player could interact with is, and what the
 * interact button does with it ("E AR-15 · replaces Glock", "Card reader ·
 * needs a keycard"), and rings it on the floor. Used in the lobby, where it's
 * big ("Nancy / E to play as"), and during a run, where it's small.
 */
export default class InteractPrompt extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Game;
  /** What's showing, for tests */
  prompt?: InteractPromptContent;
  /** What the interact button would use, if anything */
  target?: Interactable;
  highlight: InteractHighlight;

  constructor(
    private getPlayer: () => Human,
    /** Nothing shows while this says so, like while the title is up */
    private isHidden: () => boolean = () => false,
    private size: "large" | "small" = "small",
  ) {
    super(() => this.renderContent());
    this.highlight = this.addChild(new InteractHighlight());
  }

  /** The interactable the player would use, or be told about */
  private findNearest(): Interactable | undefined {
    const player = this.getPlayer();
    if (this.isHidden() || this.game.paused || !player?.isAdded) {
      return undefined;
    }
    // The one interacting would use, or a passive one when there's nothing else
    return player.getNearbyInteractables()[0];
  }

  renderContent() {
    const nearest = this.findNearest();
    this.prompt = nearest?.prompt?.(this.getPlayer());
    const prompt = this.prompt;
    // Rung when pressing the button does what the prompt says
    const usable = !!prompt && !nearest!.passive && !prompt.hint;
    this.target = usable ? nearest : undefined;
    this.highlight.target = this.target;
    if (!prompt) {
      return null;
    }

    const key = (
      <span className="interact-prompt__key">
        {this.game.io.usingGamepad ? "B" : "E"}
      </span>
    );
    const detail = prompt.detail && (
      <span className="interact-prompt__detail"> · {prompt.detail}</span>
    );

    if (this.size === "large") {
      return (
        <div className="interact-prompt interact-prompt--large">
          <div className="interact-prompt__title">
            {prompt.title}
            {detail}
          </div>
          {usable && prompt.action ? (
            <div className="interact-prompt__action">
              {key} {prompt.action}
            </div>
          ) : (
            prompt.hint && (
              <div className="interact-prompt__hint">{prompt.hint}</div>
            )
          )}
        </div>
      );
    }

    return (
      <div className="interact-prompt interact-prompt--small">
        {usable && key}
        <span className="interact-prompt__title">{prompt.title}</span>
        {detail}
        {usable && prompt.action && (
          <span className="interact-prompt__action"> {prompt.action}</span>
        )}
        {prompt.hint && (
          <span className="interact-prompt__hint"> · {prompt.hint}</span>
        )}
      </div>
    );
  }
}

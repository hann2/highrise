import Entity from "../../core/entity/Entity";
import ReactEntity from "../../core/ReactEntity";
import { InteractPrompt } from "../environment/Interactable";
import Human from "../human/Human";
import "./lobby.css";

/**
 * Says what the nearest thing in the lobby is and what interacting with it
 * does: "Nancy · E to play as", "??? · Rescue them to unlock".
 */
export default class LobbyPrompt extends ReactEntity implements Entity {
  /** What's showing, for tests */
  prompt?: InteractPrompt;

  constructor(
    private getPlayer: () => Human,
    /** Nothing shows while this says so, like while the title is up */
    private isHidden: () => boolean,
  ) {
    super(() => this.renderContent());
  }

  renderContent() {
    this.prompt = this.isHidden()
      ? undefined
      : // The one interacting would use
        this.getPlayer().getNearbyInteractables()[0]?.prompt?.();
    const prompt = this.prompt;
    if (!prompt) {
      return null;
    }
    const interactButton = this.game.io.usingGamepad ? "B" : "E";
    return (
      <div className="lobby-prompt">
        <div className="lobby-prompt__title">{prompt.title}</div>
        {prompt.action ? (
          <div className="lobby-prompt__action">
            <span className="lobby-prompt__key">{interactButton}</span>{" "}
            {prompt.action}
          </div>
        ) : (
          prompt.hint && <div className="lobby-prompt__hint">{prompt.hint}</div>
        )}
      </div>
    );
  }
}

import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { getVolumeController } from "../controllers/VolumeController";
import ClickableText from "./ClickableText";

export default class MuteButton extends ClickableText {
  constructor() {
    super("Mute", () => {
      this.game.dispatch("toggleMute", undefined);
    });
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    this.updateText(getVolumeController(game).muted);
  }

  updateText(muted: boolean) {
    this.sprite.text = muted ? "Unmute" : "Mute";
  }

  @on("muteChanged")
  onMuteChanged({ muted }: { muted: boolean }) {
    this.updateText(muted);
  }
}

import Game from "../../core/Game";
import {
  getCurrentGraphicsQuality,
  GraphicsQuality,
} from "../controllers/GraphicsQualityController";
import ClickableText from "./ClickableText";

export default class GraphicsButton extends ClickableText {
  constructor() {
    super("Graphics: ", () => {
      this.game?.dispatch("toggleGraphicsQuality", undefined);
    });
  }

  onAdd({ game }: { game: Game }) {
    this.updateText(getCurrentGraphicsQuality(game));
  }

  updateText(quality: GraphicsQuality) {
    this.sprite.text = `Graphics: ${quality}`;
  }

  onGraphicsQualityChanged({ quality }: { quality: GraphicsQuality }) {
    this.updateText(quality);
  }
}

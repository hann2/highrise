import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import {
  getCurrentGraphicsQuality,
  GraphicsQuality,
} from "../controllers/GraphicsQualityController";
import ClickableText from "./ClickableText";

export default class GraphicsButton extends ClickableText {
  constructor() {
    super("Graphics: ", () => {
      this.game.dispatch("toggleGraphicsQuality", undefined);
    });
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    this.updateText(getCurrentGraphicsQuality(game));
  }

  updateText(quality: GraphicsQuality) {
    this.sprite.text = `Graphics: ${quality}`;
  }

  @on("graphicsQualityChanged")
  onGraphicsQualityChanged({ quality }: { quality: GraphicsQuality }) {
    this.updateText(quality);
  }
}

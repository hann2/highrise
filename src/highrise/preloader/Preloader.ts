import { RESOURCES } from "../../../resources/resources";
import CorePreloader from "../../core/resources/Preloader";
import LoadingScreen from "./LoadingScreen";

/**
 * Loads all of our resources behind a loading screen that shows the title as
 * soon as the fonts are in, with a bar each for images and sounds.
 */
export default class Preloader extends CorePreloader {
  private loadingScreen = this.addChild(new LoadingScreen(this.progress));

  constructor() {
    super(RESOURCES);
  }

  /**
   * Resolves once everything is loaded and the loading bars have faded out,
   * leaving the title where the main menu draws it.
   */
  async waitTillReady() {
    await this.waitTillLoaded();
    await this.loadingScreen.finish();
  }
}

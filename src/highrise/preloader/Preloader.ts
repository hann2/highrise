import { RESOURCES } from "../../../resources/resources";
import { on } from "../../core/entity/handler";
import CorePreloader, {
  PreloaderProgress,
} from "../../core/resources/Preloader";

/** Loads all of our resources and keeps the loading screen in index.html up to date. */
export default class Preloader extends CorePreloader {
  constructor() {
    super(RESOURCES, (progress) => updateLoadingScreen(progress));
  }

  @on("destroy")
  onDestroy() {
    document.getElementById("preloader")?.remove();
  }
}

function updateLoadingScreen(progress: PreloaderProgress) {
  for (const type of ["image", "sound", "font"] as const) {
    const element = document.getElementById(`${type}-count`);
    if (element) {
      const { loaded, total } = progress[`${type}s`];
      element.innerText = `${loaded} / ${total}`;
    }
  }
}

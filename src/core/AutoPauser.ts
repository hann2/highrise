import BaseEntity from "./entity/BaseEntity";
import Entity from "./entity/Entity";
import { on } from "./entity/handler";

/** Pauses and unpauses the game when visibility is lost. */
export default class AutoPauser extends BaseEntity implements Entity {
  pausable = false;
  persistenceLevel = 100;

  autoPaused: boolean = false;

  constructor(
    /** Turned off, the game keeps its pause state when visibility is lost */
    public enabled: boolean = true,
  ) {
    super();
  }

  @on("add")
  onAdd() {
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  @on("destroy")
  onDestroy() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  onVisibilityChange = () => {
    if (document.hidden) {
      if (this.enabled && !this.game.paused) {
        this.game.pause();
        this.autoPaused = true;
      }
    } else {
      if (this.autoPaused && this.game.paused) {
        this.game.unpause();
        this.autoPaused = false;
      }
    }
  };
}

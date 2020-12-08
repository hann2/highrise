import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";

export default class ResizeListener extends BaseEntity implements Entity {
  persistent = true;

  onAdd() {
    // TODO: Why do I need the arrow function?
    window.addEventListener("resize", () => this.onResize());
  }

  onDestroy() {
    window.removeEventListener("resize", this.onResize);
  }

  onResize = () => {
    this.game?.dispatch({ type: "resize" });
  };
}

import { render, VNode } from "preact";
import BaseEntity from "./entity/BaseEntity";
import Entity from "./entity/Entity";
import { on } from "./entity/handler";
import Game from "./Game";

/**
 * Renders Preact content into a div layered over the game canvas.
 *
 * Use it for menus and HUD text, which are much easier to lay out and style as
 * HTML than as Pixi sprites. Things positioned in the world stay in Pixi.
 *
 * The content is re-rendered every frame by default, so `getReactContent` can
 * just read whatever state it needs; Preact only touches the DOM where the
 * output changed. Pass `autoRender = false` and call `reactRender()` yourself
 * for content that only changes occasionally.
 */
export default class ReactEntity extends BaseEntity implements Entity {
  el!: HTMLDivElement;

  constructor(
    public getReactContent: () => VNode | null,
    public autoRender = true,
  ) {
    super();
  }

  reactRender() {
    render(this.getReactContent(), this.el);
  }

  @on("render")
  onRender(_dt: number) {
    if (this.autoRender) {
      this.reactRender();
    }
  }

  @on("add")
  onAdd(_data: { game: Game }) {
    this.el = document.createElement("div");
    document.body.append(this.el);
    this.reactRender();
  }

  @on("destroy")
  onDestroy(_data: { game: Game }) {
    render(null, this.el);
    this.el.remove();
  }
}

import * as Pixi from "pixi.js";
import { LAYERS, LayerName } from "../../config/layers";
import { V, V2d } from "../Vector";
import { GameSprite } from "../entity/GameSprite";
import { Camera2d } from "./Camera2d";
import { LayerInfo } from "./LayerInfo";

/** Options for the GameRenderer2d constructor */
export interface GameRenderer2dOptions extends Partial<Pixi.RendererOptions> {}

/** The thing that renders stuff to the screen. Mostly for handling layers.
 * TODO: Document GameRenderer2d better
 */
export class GameRenderer2d {
  // TODO: Do we really need to store this ourselves? Can't we just set it on the canvas?
  private cursor: CSSStyleDeclaration["cursor"] = "none";

  /** The number of sprites currently managed by this renderer. Mostly useful for debugging. */
  public get spriteCount() {
    return this._spriteCount;
  }
  private set spriteCount(value) {
    this._spriteCount = value;
  }
  private _spriteCount: number = 0;

  /** TODO: Document renderer.app */
  app: Pixi.Application;

  /** TODO: Document renderer.camera */
  camera: Camera2d;

  /** TODO: Document renderer.stage */
  get stage(): Pixi.Container {
    return this.app.stage;
  }

  /** TODO: Document renderer.canvas */
  get canvas(): HTMLCanvasElement {
    return this.app.renderer.canvas;
  }

  /** TODO: Document renderer constructor */
  constructor(
    private layerInfos: Record<LayerName, LayerInfo>,
    private defaultLayerName: LayerName,
    private onResize?: ([width, height]: [number, number]) => void,
  ) {
    this.app = new Pixi.Application();
    this.showCursor();
    this.camera = new Camera2d(this, V(0, 0));

    for (const layerInfo of Object.values(LAYERS)) {
      this.app.stage.addChild(layerInfo.container);
    }

    window.addEventListener("resize", () => this.handleResize());
  }

  async init(pixiOptions: GameRenderer2dOptions = {}) {
    await this.app
      .init({
        resizeTo: window,
        autoDensity: true,
        antialias: true,
        ...pixiOptions,
      })
      .then(() => {
        document.body.appendChild(this.canvas);
      });
  }

  /**
   * Goes fullscreen on the next click anywhere on the page. The whole document
   * goes fullscreen rather than just the canvas so that HTML overlays (see
   * ReactEntity) stay visible.
   */
  requestFullscreen() {
    const makeFullScreen = () => {
      document.documentElement.requestFullscreen().catch(() => {
        // The browser can refuse (e.g. iframes without the permission); that's fine
      });
    };
    document.addEventListener("click", makeFullScreen, { once: true });
  }

  /**
   * Gets the effective height of the renderer viewport in logical pixels.
   * (Pixi 8 already reports logical sizes; dividing by the resolution again
   * was a Pixi 7 habit that broke everything at non-1 resolutions.)
   */
  getHeight(): number {
    return this.app.renderer.height;
  }

  /**
   * Gets the effective width of the renderer viewport in logical pixels.
   */
  getWidth(): number {
    return this.app.renderer.width;
  }

  getSize(): V2d {
    return V(this.getWidth(), this.getHeight());
  }

  /** Change the number of device pixels rendered per logical pixel. */
  setResolution(resolution: number) {
    this.app.renderer.resolution = resolution;
    this.handleResize();
  }

  handleResize() {
    this.app.resizeTo = window;
    this.app.resize();
    this.onResize?.(this.getSize());
  }

  hideCursor() {
    this.cursor = "none";
  }

  showCursor() {
    this.cursor = "auto";
  }

  setCursor(value: CSSStyleDeclaration["cursor"]) {
    this.cursor = value;
  }

  // Render the current frame.
  render() {
    for (const layerInfo of Object.values(this.layerInfos)) {
      this.camera.updateLayer(layerInfo);
    }
    this.app.render();
    if (this.app.renderer.view.canvas.style) {
      this.app.renderer.view.canvas.style.cursor = this.cursor;
    }
  }

  addSprite(sprite: GameSprite): GameSprite {
    const layerName = sprite.layerName ?? this.defaultLayerName;
    this.layerInfos[layerName].container.addChild(sprite);
    this.spriteCount += 1;
    return sprite;
  }

  // Remove a child from a specific layer.
  removeSprite(sprite: GameSprite): void {
    const layerName = sprite.layerName ?? this.defaultLayerName;
    this.layerInfos[layerName].container.removeChild(sprite);
    this.spriteCount -= 1;
  }

  /**
   * Adds a visual filter effect to a specific rendering layer.
   * @param filter - Pixi filter to apply to the layer
   * @param layerName - Name of the layer to apply the filter to
   */
  addLayerFilter(filter: Pixi.Filter, layerName: LayerName): void {
    const container = this.layerInfos[layerName].container;
    container.filters = [...getFilters(container), filter];
  }

  addStageFilter(filter: Pixi.Filter): void {
    this.stage.filters = [...getFilters(this.stage), filter];
  }

  removeStageFilter(filterToRemove: Pixi.Filter): void {
    this.stage.filters = getFilters(this.stage).filter(
      (filter) => filter != filterToRemove,
    );
  }
}

/** Pixi lets filters be a single filter, a list, or nothing. This always gives a list. */
function getFilters(container: Pixi.Container): readonly Pixi.Filter[] {
  const filters = container.filters;
  if (!filters) {
    return [];
  }
  return filters instanceof Array ? filters : [filters];
}

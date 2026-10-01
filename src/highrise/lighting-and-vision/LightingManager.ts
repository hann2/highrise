import { Container, RenderTexture, Sprite, Texture } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { rgbToHex } from "../../core/util/ColorUtils";
import { clamp } from "../../core/util/MathUtil";
import { measureCpuAndGpu } from "../../core/util/GpuProfiler";
import { profiler } from "../../core/util/Profiler";
import { V, V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import { AmbientLight } from "./AmbientLight";
import Light from "./Light";
import { AtlasPage, LightAtlas, StaticLightAtlas } from "./LightAtlas";
import { LIGHT_RESOLUTION } from "./lightingConstants";
import { getShadowCasters } from "./occluders";
import { ShadowCasters } from "./ShadowCasters";

/**
 * Lights the world: a screen-sized texture, cleared to the ambient color with
 * every light in view added onto it, multiplied over everything below the
 * lighting layer.
 *
 * Lights are drawn into squares of a light atlas, in a few render passes
 * however many there are: for each page, one draw call puts every light's
 * shadows in the mask page (`ShadowCasters`, with the walls kept on the GPU),
 * and one pass draws the lights into the light page and erases what their
 * masks cover. Dynamic lights are packed into `LightAtlas` pages and drawn
 * every frame; static ones keep their squares in the `StaticLightAtlas` and
 * are only drawn when they change (see `Light`). Then one more pass adds
 * every light in view onto the screen, with its brightness and color.
 */
export default class LightingManager extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  texture!: RenderTexture;
  sprite!: Sprite & GameSprite;
  lightContainer = new Container();

  lights: Set<Light> = new Set();
  ambientLights: Set<AmbientLight> = new Set();
  ambientColor = 0;
  /** The walls, on the GPU, that lights' shadow masks are drawn from */
  readonly shadowCasters = new ShadowCasters();
  /** Squares for the dynamic lights, every frame */
  private atlas = new LightAtlas();
  /** Squares for the static lights, kept */
  private staticAtlas = new StaticLightAtlas();
  /** The casters' version the static lights were drawn with */
  private castersVersion = -1;
  /** What gets drawn into a page of an atlas */
  private atlasContainer = new Container();
  /** Erase squares for clearing lights' squares (see `addClearSquares`) */
  private clearSquares: Sprite[] = [];
  /** The lights in view this frame, all of them, static and dynamic (kept to save making new arrays) */
  private inView: Light[] = [];
  private staticInView: Light[] = [];
  private dynamicInView: Light[] = [];

  private _enabled = true;
  /** When disabled, the world is drawn unlit (for debugging and benchmarks). */
  get enabled() {
    return this._enabled;
  }
  set enabled(value: boolean) {
    this._enabled = value;
    this.sprite.visible = value;
  }

  private get renderer() {
    return this.game.renderer.app.renderer;
  }

  @on("resize")
  onResize({ size: [width, height] }: { size: V2d }) {
    // The graphics quality setting changes the renderer's resolution, and
    // this texture has to match or the lighting is drawn at the wrong scale
    this.texture.resize(width, height, this.renderer.resolution);
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    const [width, height] = game.renderer.getSize();
    this.texture = RenderTexture.create({
      width,
      height,
      resolution: this.renderer.resolution,
    });

    this.sprite = new Sprite(this.texture);
    this.sprite.layerName = Layer.LIGHTING;
    this.sprite.blendMode = "multiply";
    this.sprite.anchor.set(0, 0);
  }

  @on("destroy")
  onDestroy() {
    this.shadowCasters.destroy();
    this.atlas.destroy();
    this.staticAtlas.destroy();
    this.texture.destroy(true);
  }

  addAmbientLight(light: AmbientLight) {
    this.ambientLights.add(light);
    this.updateAmbientColor();
  }

  removeAmbientLight(light: AmbientLight) {
    this.ambientLights.delete(light);
    this.updateAmbientColor();
  }

  addLight(light: Light) {
    this.lights.add(light);
  }

  removeLight(light: Light) {
    this.lights.delete(light);
    this.staticAtlas.forget(light);
  }

  updateAmbientColor() {
    let r = 0;
    let g = 0;
    let b = 0;
    for (const light of this.ambientLights) {
      r += light.color.r;
      g += light.color.g;
      b += light.color.b;
    }
    r = clamp(r, 0, 255);
    g = clamp(g, 0, 255);
    b = clamp(b, 0, 255);
    this.ambientColor = rgbToHex({ r, g, b });
  }

  // Decide whether or not to render a light
  private shouldRenderLight(
    light: Light,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ) {
    const halfSize = light.size / 2;
    return (
      light.isLit &&
      light.x - halfSize < maxX &&
      light.x + halfSize > minX &&
      light.y - halfSize < maxY &&
      light.y + halfSize > minY
    );
  }

  /** How many shapes near a light cast shadows (for benchmarks) */
  countCasterShapes(light: Light): number {
    let count = 0;
    for (const body of getShadowCasters(
      this.game,
      V(light.x, light.y),
      light.size / 2,
      false,
    )) {
      count += body.shapes.length;
    }
    return count;
  }

  // Use late render so that it happens after everyone else has rendered and all their light positions and stuff are updated
  @on("lateRender")
  onLateRender() {
    if (!this.enabled) {
      return;
    }
    const camera = this.game.camera;
    this.lightContainer.setFromMatrix(camera.getMatrix());

    const [minX, minY] = camera.toWorld(V(0, 0));
    const [maxX, maxY] = camera.toWorld(camera.getViewportSize());

    // New walls (a new level) mean a new mesh of them, and new shadows for
    // every static light
    this.shadowCasters.update(this.game);
    if (this.shadowCasters.version !== this.castersVersion) {
      this.castersVersion = this.shadowCasters.version;
      this.staticAtlas.invalidateAll();
    }

    const inView = this.inView;
    const staticInView = this.staticInView;
    const dynamicInView = this.dynamicInView;
    inView.length = staticInView.length = dynamicInView.length = 0;
    for (const light of this.lights) {
      if (this.shouldRenderLight(light, minX, minY, maxX, maxY)) {
        inView.push(light);
        (light.dynamic ? dynamicInView : staticInView).push(light);
      }
    }

    // The static lights that changed, in their squares of the static page
    if (staticInView.length > 0) {
      const changed = profiler.measure("LightingManager.packStatic", () =>
        this.staticAtlas.update(staticInView),
      );
      if (changed.length > 0) {
        measureCpuAndGpu("LightingManager.static", () => {
          this.drawLights(
            changed,
            this.staticAtlas.page!,
            this.staticAtlas.needsClear,
          );
        });
        this.staticAtlas.needsClear = false;
        for (const light of changed) {
          light.dirty = false;
        }
      }
    }

    // Every dynamic light, on pages of their own
    if (dynamicInView.length > 0) {
      const pages = profiler.measure("LightingManager.pack", () =>
        this.atlas.pack(dynamicInView),
      );
      measureCpuAndGpu("LightingManager.dynamic", () => {
        for (let i = 0; i < pages.length; i++) {
          this.drawLights(pages[i], this.atlas.pages[i], true);
        }
      });
    }

    for (const light of inView) {
      this.lightContainer.addChild(light.compositeSprite);
    }

    // Then add them all onto the ambient light
    measureCpuAndGpu("LightingManager.composite", () => {
      this.renderer.render({
        container: this.lightContainer,
        target: this.texture,
        clear: true,
        clearColor: this.ambientColor,
      });
      this.flush();
    });
    this.lightContainer.removeChildren();
  }

  /**
   * Sends what's been drawn so far to the GPU. Without this the GPU only
   * starts on the lighting once the rest of the frame is drawn, and the
   * stage's sprite batches have to wait for it to finish with the buffers
   * they share (at 32 fires in the offices that was 85 fps instead of 110).
   */
  private flush() {
    const gl = (this.renderer as { gl?: WebGL2RenderingContext }).gl;
    gl?.flush();
  }

  /**
   * Draws the masks, then the lights, of `lights` into their squares of
   * `page`. With `clearPage` the whole page is cleared first; without it the
   * rest of the page is kept, and only the lights' own squares are cleared.
   */
  private drawLights(
    lights: readonly Light[],
    page: AtlasPage,
    clearPage: boolean,
  ) {
    const shadowed = lights.filter((light) => light.shadowsEnabled);
    const casters = this.shadowCasters;
    const drawMasks = shadowed.length > 0 && !casters.isEmpty;
    const container = this.atlasContainer;
    if (drawMasks) {
      measureCpuAndGpu("LightingManager.masks", () => {
        if (!clearPage) {
          // Masks add up, so their squares have to be clear first
          this.addClearSquares(container, shadowed);
          this.renderer.render({ container, target: page.mask, clear: false });
          container.removeChildren();
        }
        casters.draw(this.renderer, shadowed, page.mask, clearPage);
      });
    }

    measureCpuAndGpu("LightingManager.lights", () => {
      if (!clearPage) {
        this.addClearSquares(container, lights);
      }
      for (const light of lights) {
        container.addChild(light.container);
      }
      if (drawMasks) {
        // After all the lights: the squares don't overlap, so this erases
        // each one's shadows from it alone, and they can all be one draw call
        for (const light of shadowed) {
          container.addChild(light.maskSprite);
        }
      }
      this.renderer.render({
        container,
        target: page.light,
        clear: clearPage,
        clearColor: [0, 0, 0, 0],
      });
      container.removeChildren();
      this.flush();
    });
  }

  /**
   * Adds a square to `container` over each light's square in the atlas
   * (padding and all) that erases whatever's there: Pixi can't clear part of
   * a texture, but an opaque white square in the "erase" blend mode leaves
   * nothing behind
   */
  private addClearSquares(container: Container, lights: readonly Light[]) {
    for (let i = 0; i < lights.length; i++) {
      let square = this.clearSquares[i];
      if (!square) {
        square = new Sprite(Texture.WHITE);
        square.anchor.set(0.5);
        square.blendMode = "erase";
        this.clearSquares.push(square);
      }
      const slot = lights[i].slot!;
      square.position.set(slot.x, slot.y);
      square.width = square.height = slot.side / LIGHT_RESOLUTION;
      container.addChild(square);
    }
  }
}

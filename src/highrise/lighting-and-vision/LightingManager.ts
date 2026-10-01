import { Container, RenderTexture, Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { rgbToHex } from "../../core/util/ColorUtils";
import { clamp } from "../../core/util/MathUtil";
import { profiler } from "../../core/util/Profiler";
import { V, V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import { AmbientLight } from "./AmbientLight";
import Light from "./Light";
import { LightAtlas } from "./LightAtlas";
import { getShadowCasters } from "./occluders";
import { ShadowCasters } from "./ShadowCasters";

/**
 * Lights the world: a screen-sized texture, cleared to the ambient color with
 * every light in view added onto it, multiplied over everything below the
 * lighting layer.
 *
 * All the lights are drawn every frame, in a few render passes however many
 * there are. Each gets a square of the `LightAtlas`, and for each page of it:
 * one draw call puts every light's shadows in the mask page (`ShadowCasters`,
 * with the walls kept on the GPU), and one pass draws the lights into the
 * light page and erases what their masks cover. Then one more pass adds every
 * light's square onto the screen, with its brightness and color.
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
  private atlas = new LightAtlas();
  /** What gets drawn into a page of the light atlas */
  private atlasContainer = new Container();
  /** The lights in view this frame (kept to save making a new array) */
  private inView: Light[] = [];

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

    // New walls (a new level) mean a new mesh of them
    this.shadowCasters.update(this.game);

    const inView = this.inView;
    inView.length = 0;
    for (const light of this.lights) {
      if (this.shouldRenderLight(light, minX, minY, maxX, maxY)) {
        inView.push(light);
      }
    }

    if (inView.length > 0) {
      const pages = profiler.measure("LightingManager.pack", () =>
        this.atlas.pack(inView),
      );
      for (let i = 0; i < pages.length; i++) {
        this.drawPage(pages[i], i);
      }
      for (const light of inView) {
        this.lightContainer.addChild(light.compositeSprite);
      }
    }

    // Then add them all onto the ambient light
    profiler.measure("LightingManager.composite", () => {
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

  /** Draws the masks, then the lights, of the lights on one page of the atlas */
  private drawPage(lights: readonly Light[], index: number) {
    const page = this.atlas.pages[index];
    const shadowed = lights.filter((light) => light.shadowsEnabled);
    const casters = this.shadowCasters;
    const drawMasks = shadowed.length > 0 && !casters.isEmpty;
    if (drawMasks) {
      profiler.measure("LightingManager.masks", () => {
        casters.setLights(shadowed);
        this.renderer.render({
          container: casters.mesh,
          target: page.mask,
          clear: true,
          // The default clear color is the renderer's opaque background
          clearColor: [0, 0, 0, 0],
        });
      });
    }

    profiler.measure("LightingManager.lights", () => {
      const container = this.atlasContainer;
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
        clear: true,
        clearColor: [0, 0, 0, 0],
      });
      container.removeChildren();
      this.flush();
    });
  }
}

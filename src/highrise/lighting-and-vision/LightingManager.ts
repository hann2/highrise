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

export default class LightingManager extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  texture!: RenderTexture;
  sprite!: Sprite & GameSprite;
  lightContainer = new Container();

  lights: Set<Light> = new Set();
  ambientLights: Set<AmbientLight> = new Set();
  ambientColor = 0;

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

    // Baked textures don't survive the renderer being resized, so re-bake
    // them. Lazily, so that the off-screen ones don't all pile up in one frame.
    for (const light of this.lights) {
      light.dirty = true;
    }
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
    const { x, y } = light.bakedSprite.position;
    const halfSize = light.size / 2;

    return (
      light.enabled &&
      x - halfSize < maxX &&
      x + halfSize > minX &&
      y - halfSize < maxY &&
      y + halfSize > minY
    );
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

    // Make sure all lights are baked, then add them to the render object
    for (const light of this.lights) {
      if (this.shouldRenderLight(light, minX, minY, maxX, maxY)) {
        light.bakeIfNeeded();
        this.lightContainer.addChild(light.bakedSprite);
      }
    }

    // Then render it all on top of the ambient light
    profiler.measure("LightingManager.composite", () => {
      this.renderer.render({
        container: this.lightContainer,
        target: this.texture,
        clear: true,
        clearColor: this.ambientColor,
      });
    });
    this.lightContainer.removeChildren();
  }
}

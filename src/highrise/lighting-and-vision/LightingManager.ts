import { Container, RenderTexture, Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import Game from "../../core/Game";
import { rgbToHex } from "../../core/util/ColorUtils";
import { clamp } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import { AmbientLight } from "./AmbientLight";
import Light from "./Light";

export default class LightingManager extends BaseEntity implements Entity {
  id = "lighting_manager";
  persistenceLevel = Persistence.Game;

  texture!: RenderTexture;
  sprite!: Sprite & GameSprite;
  lightContainer = new Container();

  lights: Set<Light> = new Set();
  ambientLights: Set<AmbientLight> = new Set();
  ambientColor = 0;

  private get renderer() {
    return this.game!.renderer.app.renderer;
  }

  onResize({ size: [width, height] }: { size: V2d }) {
    this.texture.resize(width, height);

    // For some reason this needs to happen
    for (const light of this.lights) {
      light.dirty = true;
      light.bakeIfNeeded();
    }
  }

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
    r = clamp(r, 0, 256);
    g = clamp(g, 0, 256);
    b = clamp(b, 0, 256);
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
    const { x: rx, y: ry, width, height } = light.bakedSprite.getLocalBounds();

    return (
      x + rx < maxX &&
      x + rx + width > minX &&
      y + ry < maxY &&
      y + ry + height > minY
    );
  }

  // Use late render so that it happens after everyone else has rendered and all their light positions and stuff are updated
  onLateRender() {
    const camera = this.game!.camera;
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
    this.renderer.render({
      container: this.lightContainer,
      target: this.texture,
      clear: true,
      clearColor: this.ambientColor,
    });
    this.lightContainer.removeChildren();
  }
}

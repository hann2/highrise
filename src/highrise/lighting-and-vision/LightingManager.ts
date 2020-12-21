import { BLEND_MODES, Graphics, RenderTexture, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { rgbToHex } from "../../core/util/ColorUtils";
import { clamp } from "../../core/util/MathUtil";
import { V } from "../../core/Vector";
import { Layer } from "../config/layers";
import { Persistence } from "../constants/constants";
import { AmbientLight } from "./AmbientLight";
import Light from "./Light";

export default class LightingManager extends BaseEntity implements Entity {
  id = "lighting_manager";
  persistenceLevel = Persistence.Game;

  texture!: RenderTexture;
  sprite!: Sprite & GameSprite;
  lightContainer = new Sprite();
  darkness: Graphics = new Graphics();

  lights: Set<Light> = new Set();
  ambientLights: Set<AmbientLight> = new Set();
  ambientColor = 0;

  private get renderer() {
    return this.game!.renderer.pixiRenderer;
  }

  handlers = {
    resize: () => {
      const { width, height, resolution } = this.renderer;
      this.texture.resize(width / resolution, height / resolution);
      this.drawDarkness();
    },
  };

  onAdd() {
    const { width, height, resolution } = this.renderer;
    this.texture = RenderTexture.create({
      width: width / resolution,
      height: height / resolution,
      resolution: resolution / 2,
    });

    this.sprite = new Sprite(this.texture);
    this.sprite.layerName = Layer.LIGHTING;
    this.sprite.blendMode = BLEND_MODES.MULTIPLY;
    this.sprite.anchor.set(0, 0);

    this.drawDarkness();

    this.lightContainer.blendMode = BLEND_MODES.ADD;
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

  drawDarkness() {
    const { width, height } = this.texture;
    this.darkness
      .beginFill(this.ambientColor)
      .drawRect(0, 0, width, height)
      .endFill();
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
    this.drawDarkness();
  }

  // Decide whether or not to render a light
  private shouldRenderLight(
    light: Light,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
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

  // Use render 2 so that it happens after everyone else has rendered and all their light positions and stuff are updated
  onRender2() {
    const matrix = this.game!.camera.getMatrix();
    // const inverseMatrix = matrix.clone().invert();
    this.lightContainer.transform.setFromMatrix(matrix);

    // Clear everything
    this.renderer.render(this.darkness, this.texture, true);

    const camera = this.game!.camera;
    const [minX, minY] = camera.toWorld(V(0, 0));
    const [maxX, maxY] = camera.toWorld(camera.getViewportSize());

    // Make sure all lights are baked, then add them to the render object
    for (const light of this.lights) {
      if (this.shouldRenderLight(light, minX, minY, maxX, maxY)) {
        light.bakeIfNeeded();
        this.lightContainer.addChild(light.bakedSprite);
      }
    }

    // Then render it all
    this.renderer.render(this.lightContainer, this.texture, false);
    this.lightContainer.removeChildren();
  }
}

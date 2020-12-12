import { BLEND_MODES, Graphics, RenderTexture, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { V } from "../../core/Vector";
import { Layers } from "../layers";
import Light from "./Light";

const AMBIENT_LIGHT = 0x191919;
export default class LightingManager extends BaseEntity implements Entity {
  id = "lighting_manager";
  persistent = true;

  texture!: RenderTexture;
  sprite!: Sprite & GameSprite;
  lightContainer = new Sprite();
  darkness: Graphics = new Graphics();

  lights: Set<Light> = new Set();

  private get renderer() {
    return this.game!.renderer.pixiRenderer;
  }

  handlers = {
    resize: () => {
      const { width, height, resolution } = this.renderer;
      this.texture.resize(width / resolution, height / resolution);
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
    this.sprite.layerName = Layers.LIGHTING;
    this.sprite.blendMode = BLEND_MODES.MULTIPLY;
    this.sprite.anchor.set(0, 0);

    this.darkness
      .beginFill(AMBIENT_LIGHT)
      .drawRect(0, 0, width, height)
      .endFill();

    this.lightContainer.blendMode = BLEND_MODES.ADD;
  }

  addLight(light: Light) {
    this.lights.add(light);
  }

  removeLight(light: Light) {
    this.lights.delete(light);
  }

  // Decide whether or not to render a light
  private shouldRenderLight(light: Light) {
    const { x, y } = light.lightSprite.position;
    const { width, height } = light.lightSprite;

    const camera = this.game!.camera;
    const [minX, minY] = camera.toWorld(V(0, 0));
    const [maxX, maxY] = camera.toWorld(camera.getViewportSize());

    // Make sure that the light overlaps the viewport
    // TODO: This is broken
    return (
      true || (x < maxX && x + width > minX && y < maxY && y + height > minY)
    );
  }

  onRender() {
    const matrix = this.game!.camera.getMatrix();
    // const inverseMatrix = matrix.clone().invert();
    this.lightContainer.transform.setFromMatrix(matrix);

    // Clear everything
    // TODO: This doesn't really have to be a separate render pass
    this.renderer.render(this.darkness, this.texture, true);

    // Make sure all lights are baked, then add them to the render object
    for (const light of this.lights) {
      if (this.shouldRenderLight(light)) {
        light.bakeIfNeeded();
        this.lightContainer.addChild(light.bakedSprite);
      }
    }

    // Then render it all
    this.renderer.render(this.lightContainer, this.texture, false);
    this.lightContainer.removeChildren();
  }
}

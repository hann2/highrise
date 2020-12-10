import { BLEND_MODES, Graphics, RenderTexture, Sprite, Texture } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Layers } from "../layers";
import Light from "./Light";
import { LightFilter, ShadowFilter } from "./LightingFilter";

const AMBIENT_LIGHT = 0x111133;
export default class LightingManager extends BaseEntity implements Entity {
  id = "lighting_manager";
  persistent = true;

  texture!: RenderTexture;
  sprite!: Sprite & GameSprite;
  lightContainer = new Sprite();
  shadowContainer = new Sprite();
  darkness: Graphics = new Graphics();

  lightsWithoutShadows: Set<Light> = new Set();
  lightsWithShadows: Set<Light> = new Set();

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
    // this.sprite.blendMode = BLEND_MODES.MULTIPLY;
    this.sprite.blendMode = BLEND_MODES.NORMAL;
    this.sprite.anchor.set(0, 0);

    this.darkness
      .beginFill(AMBIENT_LIGHT)
      .drawRect(0, 0, width, height)
      .endFill();

    this.lightContainer.blendMode = BLEND_MODES.ADD;
    this.lightContainer.filters = [new LightFilter()];

    this.shadowContainer.blendMode = BLEND_MODES.MULTIPLY;
    this.shadowContainer.filters = [new ShadowFilter()];
  }

  addLight(light: Light) {
    if (light.shadows) {
      this.lightsWithShadows.add(light);
      console.log("shadow light");
    } else {
      this.lightsWithoutShadows.add(light);
      console.log("shadowless light");
    }
  }

  removeLight(light: Light) {
    this.lightsWithShadows.delete(light);
    this.lightsWithoutShadows.delete(light);
  }

  onRender() {
    const matrix = this.game!.camera.getMatrix();
    this.lightContainer.transform.setFromMatrix(matrix);
    this.shadowContainer.transform.setFromMatrix(matrix);

    // Clear everything
    this.renderer.render(this.darkness, this.texture, true);

    // We can render all the shadowless lights in a single pass
    for (const light of this.lightsWithoutShadows) {
      this.lightContainer.addChild(light.lightSprite);
    }
    this.renderer.render(this.lightContainer, this.texture, false);
    this.lightContainer.removeChildren();

    // TODO: Somehow use fewer render calls
    //   - Bake lights
    //   -
    for (const light of this.lightsWithShadows) {
      this.shadowContainer.addChild(light.shadows!.graphics);
      this.renderer.render(this.shadowContainer, this.texture, false);
      this.shadowContainer.removeChild(light.shadows!.graphics);
      this.lightContainer.addChild(light.lightSprite);
      this.renderer.render(this.lightContainer, this.texture, false);
      this.lightContainer.removeChild(light.lightSprite);
    }

    // TODO: Different stuff for static lights
    // TODO: For Each Light:
    //   render shadows to alpha channel
    //   render light to color channels, but multiply color by alpha
    //   clear alpha channel
  }
}

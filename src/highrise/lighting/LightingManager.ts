import { BLEND_MODES, Graphics, RenderTexture, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Layers } from "../layers";
import Light from "./Light";

export default class LightingManager extends BaseEntity implements Entity {
  id = "lighting_manager";
  persistent = true;
  texture!: RenderTexture;

  sprite!: Sprite & GameSprite;
  lightwrapper = new Graphics();

  private get renderer() {
    return this.game!.renderer.pixiRenderer;
  }

  onAdd() {
    const { width, height, resolution } = this.renderer;
    this.texture = RenderTexture.create({
      width: width / resolution,
      height: height / resolution,
      resolution,
    });

    this.sprite = new Sprite(this.texture);
    this.sprite.layerName = Layers.LIGHTING;
    this.sprite.blendMode = BLEND_MODES.MULTIPLY;
    this.sprite.anchor.set(0, 0);
    // this.sprite.scale.set(1 / resolution);

    const darkness = new Graphics();
    darkness.beginFill(0x222233);
    darkness.drawRect(-100, -100, 1000, 1000);
    darkness.endFill();

    this.lightwrapper.blendMode = BLEND_MODES.ADD;
    this.lightwrapper.addChild(darkness);
  }

  addLight(light: Light) {
    this.lightwrapper.addChild(light.lightSprite);
  }

  removeLight(light: Light) {
    this.lightwrapper.removeChild(light.lightSprite);
  }

  // TODO: On resize

  onRender() {
    this.lightwrapper.transform.setFromMatrix(this.game!.camera.getMatrix());
    this.renderer.render(this.lightwrapper, this.texture);
  }
}

const res = 8;
function makeLight([x, y]: [number, number]) {
  const graphics = new Graphics();
  graphics.beginFill(0x444444);
  graphics.drawCircle(res * x, res * y, res * 4);
  graphics.endFill();
  graphics.blendMode = BLEND_MODES.ADD;

  graphics.scale.set(1.0 / res);
  return graphics;
}

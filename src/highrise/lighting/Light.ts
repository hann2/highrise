import { BLEND_MODES, DisplayObject, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import LightingManager from "./LightingManager";

export default abstract class Light extends BaseEntity implements Entity {
  lightSprite!: Sprite;

  private lightManager?: LightingManager;

  private getLightingManager() {
    return;
  }

  onAdd() {
    this.lightManager = this.game!.entities.getById(
      "lighting_manager"
    ) as LightingManager;
    this.lightManager.addLight(this);
  }

  onDestroy() {
    console.log("light onDestroy()");
    this.lightManager!.removeLight(this);
    this.lightManager = undefined;
  }
}

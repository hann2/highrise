import { BLEND_MODES, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import LightingManager from "./LightingManager";

export default class Light extends BaseEntity implements Entity {
  constructor(public lightSprite: Sprite = new Sprite()) {
    super();
    this.lightSprite.blendMode = BLEND_MODES.ADD;
  }

  private lightManager?: LightingManager;

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

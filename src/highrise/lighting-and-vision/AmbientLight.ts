import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { hexToRgb, RGB } from "../../core/util/ColorUtils";
import LightingManager from "./LightingManager";

export class AmbientLight extends BaseEntity implements Entity {
  private lightManager?: LightingManager;

  public color: RGB;

  constructor(color: number) {
    super();

    this.color = hexToRgb(color);
  }

  onAdd() {
    this.lightManager = this.game!.entities.getById(
      "lighting_manager"
    ) as LightingManager;
    this.lightManager.addAmbientLight(this);
  }

  onDestroy() {
    this.lightManager!.removeAmbientLight(this);
    this.lightManager = undefined;
  }
}

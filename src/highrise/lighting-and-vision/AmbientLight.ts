import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { hexToRgb, RGB } from "../../core/util/ColorUtils";
import LightingManager from "./LightingManager";

export class AmbientLight extends BaseEntity implements Entity {
  private lightManager?: LightingManager;

  public color: RGB;

  constructor(color: number) {
    super();

    this.color = hexToRgb(color);
  }

  @on("add")
  onAdd() {
    this.lightManager = this.game.entities.getSingleton(LightingManager);
    this.lightManager.addAmbientLight(this);
  }

  @on("destroy")
  onDestroy() {
    this.lightManager!.removeAmbientLight(this);
    this.lightManager = undefined;
  }
}

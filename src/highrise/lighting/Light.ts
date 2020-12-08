import { BLEND_MODES, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import LightingManager from "./LightingManager";
import { ShadowMask } from "./Shadows";

export default class Light extends BaseEntity implements Entity {
  shadows?: ShadowMask;

  constructor(
    public lightSprite: Sprite = new Sprite(),
    public shadowsEnabled: boolean = false,
    position?: [number, number]
  ) {
    super();
    this.lightSprite.blendMode = BLEND_MODES.ADD;

    if (shadowsEnabled) {
      this.enableShadows();
    }

    position && this.setPosition(position);
  }

  private lightManager?: LightingManager;

  enableShadows() {
    this.shadowsEnabled = true;
    if (!this.shadows) {
      const { x, y } = this.lightSprite.position;
      this.shadows = this.addChild(
        new ShadowMask(V(x, y), this.getShadowRadius())
      );
      this.lightSprite.mask = this.shadows.mask;
      // this.lightSprite.addChild(this.shadows.mask);
    }
  }

  disableShadows() {
    this.shadowsEnabled = false;
    this.shadows?.destroy();
    this.shadows = undefined;
    this.lightSprite.mask = null;
  }

  getShadowRadius(): number {
    return 0;
  }

  setPosition([x, y]: [number, number]) {
    this.lightSprite.position.set(x, y);
    this.shadows?.setPosition(V(x, y));
  }

  getPosition(): V2d {
    return V(this.lightSprite.x, this.lightSprite.y);
  }

  setIntensity(value: number) {
    this.lightSprite.alpha = value;
  }

  setColor(value: number) {
    this.lightSprite.tint = value;
  }

  onAdd() {
    this.lightManager = this.game!.entities.getById(
      "lighting_manager"
    ) as LightingManager;
    this.lightManager.addLight(this);
  }

  onDestroy() {
    this.lightManager!.removeLight(this);
    this.lightManager = undefined;
  }
}

import { BLEND_MODES, RenderTexture, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import LightingManager from "./LightingManager";
import { Shadows } from "./Shadows";

const RESOLUTION = 64;

export default class Light extends BaseEntity implements Entity {
  public shadows?: Shadows;

  public bakedLightSprite: Sprite;
  public bakedTexture: RenderTexture;
  public dirty: boolean;

  constructor(
    public lightSprite: Sprite = new Sprite(),
    public shadowsEnabled: boolean = false,
    position?: [number, number]
  ) {
    super();

    if (shadowsEnabled) {
      this.enableShadows();
    }

    position && this.setPosition(position);

    this.dirty = true;
    this.bakedTexture = RenderTexture.create({
      width: this.lightSprite.width,
      height: this.lightSprite.height,
      resolution: RESOLUTION,
    });
    this.bakedLightSprite = Sprite.from(this.bakedTexture);
    this.bakedLightSprite.anchor.set(0.5, 0.5);
    this.bakedLightSprite.blendMode = BLEND_MODES.ADD;

    // TODO: Resizing and stuff
  }

  resizeBakedTexture() {
    this.bakedTexture.resize(
      this.lightSprite.width,
      this.lightSprite.height,
      true
    );
  }

  get needsBaking(): boolean {
    return this.dirty || Boolean(this.shadows?.dirty);
  }

  bakeIfNeeded() {
    if (this.needsBaking) {
      this.shadows?.updateIfDirty();

      this.game?.renderer.pixiRenderer.render(
        this.lightSprite,
        this.bakedTexture,
        true
      );

      this.dirty = false;
    }
  }

  private lightManager?: LightingManager;

  enableShadows() {
    this.dirty = true;
    this.shadowsEnabled = true;
    if (!this.shadows) {
      const { x, y } = this.lightSprite.position;
      const sx = x + this.lightSprite.width / 2;
      const sy = y + this.lightSprite.height / 2;
      const r = this.getShadowRadius();
      this.shadows = this.addChild(new Shadows(V(sx, sy), r));
      this.shadows.graphics.position.set(
        this.lightSprite.width / 2,
        this.lightSprite.height / 2
      );
      this.lightSprite.addChild(this.shadows.graphics);

      // TODO: This is kinda hacky, but it gets the job done
      this.lightManager?.removeLight(this);
      this.lightManager?.addLight(this);
    }
  }

  disableShadows() {
    this.dirty = true;
    this.shadowsEnabled = false;
    if (this.shadows) {
      this.shadows?.destroy();
      this.lightSprite.removeChild(this.shadows.graphics);
      this.shadows = undefined;
    }

    // TODO: This is kinda hacky, but it gets the job done
    this.lightManager?.removeLight(this);
    this.lightManager?.addLight(this);
  }

  getShadowRadius(): number {
    return 0;
  }

  setPosition([x, y]: [number, number]) {
    this.bakedLightSprite.position.set(x, y);
    // this.lightSprite.position.set(x, y);
    this.shadows?.setPosition(V(x, y));
  }

  getPosition(): V2d {
    return V(this.lightSprite.x, this.lightSprite.y);
  }

  setIntensity(value: number) {
    // TODO: This is unreliable since it also messes with shadows
    // this.lightSprite.alpha = value;
  }

  setColor(value: number) {
    // TODO: This is unreliable since it also messes with shadows
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

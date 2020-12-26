import * as Pixi from "pixi.js";
import { BLEND_MODES, Container, Matrix, RenderTexture, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V } from "../../core/Vector";
import LightingManager from "./LightingManager";
import { Shadows } from "./Shadows";

const RESOLUTION = 32;

export default class Light extends BaseEntity implements Entity {
  public shadows?: Shadows;
  private lightManager?: LightingManager;
  public bakedSprite: Sprite;
  public bakedTexture: RenderTexture;
  public dirty: boolean;
  public container: Container = new Container();

  constructor(
    public lightSprite: Sprite = new Sprite(),
    public shadowsEnabled: boolean = false,
    public shadowRadius: number = 1,
    public softShadows: boolean = false
  ) {
    super();

    // Make sure we add this before shadows
    this.container.addChild(lightSprite);

    this.dirty = true;
    this.bakedTexture = RenderTexture.create({
      width: this.lightSprite.width,
      height: this.lightSprite.height,
      resolution: RESOLUTION,
    });
    this.bakedSprite = Sprite.from(this.bakedTexture);
    this.bakedSprite.anchor.set(0.5, 0.5);
    this.bakedSprite.blendMode = BLEND_MODES.ADD;

    if (this.shadowsEnabled) {
      this.enableShadows();
    }
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

      const transform = new Matrix();
      transform.translate(
        this.lightSprite.width * 0.5,
        this.lightSprite.height * 0.5
      );
      this.game?.renderer.pixiRenderer.render(
        this.container,
        this.bakedTexture,
        true,
        transform
      );

      this.dirty = false;
    }
  }

  enableShadows() {
    this.dirty = true;
    this.shadowsEnabled = true;
    if (!this.shadows) {
      const { x, y } = this.lightSprite.position;
      this.shadows = this.addChild(new Shadows(V(x, y), this.shadowRadius));
      this.container.addChild(this.shadows.graphics);

      if (this.softShadows) {
        this.shadows.graphics.filters = [new Pixi.filters.BlurFilter(1)];
      }
    }
  }

  disableShadows() {
    this.dirty = true;
    this.shadowsEnabled = false;
    if (this.shadows) {
      this.shadows?.destroy();
      this.container.removeChild(this.shadows.graphics);
      this.shadows = undefined;
    }
  }

  setPosition([x, y]: [number, number]) {
    this.dirty = true;
    this.bakedSprite.position.set(x, y);
    this.shadows?.setPosition(V(x, y));
  }

  setIntensity(value: number) {
    this.dirty = true;
    this.lightSprite.alpha = value;
  }

  setColor(value: number) {
    this.dirty = true;
    this.lightSprite.tint = value;
  }
}

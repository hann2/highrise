import { BLEND_MODES, Container, Matrix, RenderTexture, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import LightingManager from "./LightingManager";
import { Shadows } from "./Shadows";

const RESOLUTION = 32;

export default class Light extends BaseEntity implements Entity {
  public shadows?: Shadows;

  public bakedSprite: Sprite;
  public bakedTexture: RenderTexture;
  public dirty: boolean;
  public container: Container = new Container();

  constructor(
    public lightSprite: Sprite = new Sprite(),
    public shadowsEnabled: boolean = false
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
  }

  onAdd() {
    this.lightManager = this.game!.entities.getById(
      "lighting_manager"
    ) as LightingManager;
    this.lightManager.addLight(this);

    if (this.shadowsEnabled) {
      this.enableShadows();
    }
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

  private lightManager?: LightingManager;

  enableShadows() {
    this.dirty = true;
    this.shadowsEnabled = true;
    if (!this.shadows) {
      const { x, y } = this.lightSprite.position;
      const r = this.getShadowRadius();
      this.shadows = this.addChild(new Shadows(V(x, y), r));
      this.container.addChild(this.shadows.graphics);

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
      this.container.removeChild(this.shadows.graphics);
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

  onDestroy() {
    this.lightManager!.removeLight(this);
    this.lightManager = undefined;
  }
}

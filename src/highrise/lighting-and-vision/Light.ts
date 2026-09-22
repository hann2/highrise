import { Container, Matrix, RenderTexture, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
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
    public softShadows: boolean = false,
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
    this.bakedSprite = new Sprite(this.bakedTexture);
    this.bakedSprite.anchor.set(0.5, 0.5);
    this.bakedSprite.blendMode = "add";

    if (this.shadowsEnabled) {
      this.enableShadows();
    }
  }

  @on("add")
  onAdd() {
    this.lightManager = this.game!.entities.getSingleton(LightingManager);
    this.lightManager.addLight(this);
  }

  @on("destroy")
  onDestroy() {
    this.lightManager!.removeLight(this);
    this.lightManager = undefined;
  }

  resizeBakedTexture() {
    this.bakedTexture.resize(this.lightSprite.width, this.lightSprite.height);
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
        this.lightSprite.height * 0.5,
      );
      this.game?.renderer.app.renderer.render({
        container: this.container,
        target: this.bakedTexture,
        clear: true,
        transform,
      });

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

      // TODO: Make soft shadows work (this.softShadows)
    }
  }

  disableShadows() {
    this.dirty = true;
    this.shadowsEnabled = false;
    if (this.shadows) {
      this.container.removeChild(this.shadows.graphics);
      this.shadows.destroy();
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

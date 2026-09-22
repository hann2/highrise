import { BlurFilter, Container, Graphics, Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { V } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import {
  getCurrentGraphicsQuality,
  GraphicsQuality,
} from "../controllers/GraphicsQualityController";
import Human from "../human/Human";
import { Shadows } from "./Shadows";

export const MAX_VISION = 10; // meters
/** How wide the "eye" is, in meters. Softens the edges of what can be seen. */
const VISION_SOURCE_RADIUS = 0.25;
/**
 * Per quality level: pixels per meter of the vision mask (the screen is about
 * 65 px/m at the default zoom, twice that on a retina display), and an
 * on-screen blur of the mask, in screen pixels, that softens the edges right
 * next to walls where the penumbrae are too narrow to.
 */
const VISION_QUALITY: Record<
  GraphicsQuality,
  { resolution: number; sourceRadius: number; blur?: BlurFilter }
> = {
  [GraphicsQuality.Low]: { resolution: 32, sourceRadius: 0 },
  [GraphicsQuality.Medium]: {
    resolution: 64,
    sourceRadius: VISION_SOURCE_RADIUS,
    blur: new BlurFilter({ strength: 3, quality: 1 }),
  },
  [GraphicsQuality.High]: {
    resolution: 64,
    sourceRadius: VISION_SOURCE_RADIUS,
    blur: new BlurFilter({ strength: 6, quality: 2 }),
  },
};

export default class VisionController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  shadows: Shadows;
  sprite: Container & GameSprite;

  private _enabled = true;
  /** When disabled, everything is visible (for cheats and benchmarks). */
  get enabled() {
    return this._enabled;
  }
  set enabled(value: boolean) {
    this._enabled = value;
    this.sprite.visible = value;
  }

  constructor(private getPlayer: () => Human | undefined) {
    super();

    this.shadows = this.addChild(
      new Shadows({
        position: V(0, 0),
        radius: MAX_VISION,
        checkDynamicBodies: true,
        sourceRadius: VISION_SOURCE_RADIUS,
      }),
    );

    const fog = Sprite.from("visionFog");
    fog.blendMode = "multiply";
    fog.width = MAX_VISION * 2;
    fog.height = MAX_VISION * 2;
    fog.anchor.set(0.5);

    const distanceShadows = new Graphics();
    distanceShadows
      .rect(-100, -100, 200, 200)
      .fill(0x000000)
      .rect(-MAX_VISION, -MAX_VISION, 2 * MAX_VISION, 2 * MAX_VISION)
      .cut();

    this.sprite = new Container();
    // Blocked areas are drawn black
    this.shadows.maskSprite.tint = 0x000000;
    this.sprite.addChild(this.shadows.maskSprite, fog, distanceShadows);
    this.sprite.layerName = Layer.VISION;
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    this.onGraphicsQualityChanged({
      quality: getCurrentGraphicsQuality(game),
    });
  }

  @on("graphicsQualityChanged")
  onGraphicsQualityChanged({ quality }: { quality: GraphicsQuality }) {
    const { resolution, blur, sourceRadius } = VISION_QUALITY[quality];
    this.shadows.setResolution(resolution);
    this.shadows.setSourceRadius(sourceRadius);
    // Filters only work on the stage, not inside the mask render
    this.shadows.maskSprite.filters = blur ? [blur] : [];
  }

  @on("render")
  onRender() {
    if (!this.enabled) {
      return;
    }
    const player = this.getPlayer();
    if (player) {
      const position = player.getPosition();
      this.sprite.position.copyFrom(position);
      this.shadows.setPosition(position);
      // Doors can move without the player moving, so always rebuild
      this.shadows.forceUpdate();
    }
  }
}

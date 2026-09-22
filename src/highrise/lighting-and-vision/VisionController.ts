import { Container, Graphics, Sprite } from "pixi.js";
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
/** Pixels per meter of the vision mask */
const VISION_RESOLUTION: Record<GraphicsQuality, number> = {
  [GraphicsQuality.Low]: 16,
  [GraphicsQuality.Medium]: 32,
  [GraphicsQuality.High]: 64,
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
      new Shadows(V(0, 0), MAX_VISION, true, VISION_SOURCE_RADIUS),
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
    // Soft edges cost a few extra triangles per wall, so only skip them on Low
    this.shadows.setSourceRadius(
      quality === GraphicsQuality.Low ? 0 : VISION_SOURCE_RADIUS,
    );
    this.shadows.setResolution(VISION_RESOLUTION[quality]);
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

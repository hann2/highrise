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

    this.shadows = this.addChild(new Shadows(V(0, 0), MAX_VISION, true));

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
    this.sprite.addChild(this.shadows.graphics, fog, distanceShadows);
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
    switch (quality) {
      case GraphicsQuality.Low: {
        this.shadows.graphics.filters = [];
        break;
      }
      case GraphicsQuality.Medium: {
        const blurFilter = new BlurFilter({ strength: 4, quality: 1 });
        blurFilter.repeatEdgePixels = true;
        this.shadows.graphics.filters = [blurFilter];
        break;
      }
      case GraphicsQuality.High: {
        const blurFilter = new BlurFilter({ strength: 8, quality: 4 });
        blurFilter.repeatEdgePixels = true;
        this.shadows.graphics.filters = [blurFilter];
        break;
      }
    }
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
      this.shadows.forceUpdate();
    }
  }
}

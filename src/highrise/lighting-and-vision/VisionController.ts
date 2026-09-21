import { BlurFilter, Container, Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import Game from "../../core/Game";
import { V } from "../../core/Vector";
import { Layer } from "../../config/layers";
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
    this.sprite.addChild(this.shadows.graphics);
    this.sprite.addChild(fog);
    this.sprite.addChild(distanceShadows);
    this.sprite.layerName = Layer.VISION;
  }

  onAdd({ game }: { game: Game }) {
    this.onGraphicsQualityChanged({
      quality: getCurrentGraphicsQuality(game),
    });
  }

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

  onRender() {
    const player = this.getPlayer();
    if (player) {
      const position = player.getPosition();
      this.sprite.position.set(...position);
      this.shadows.setPosition(position);
      this.shadows.forceUpdate();
    }
  }
}

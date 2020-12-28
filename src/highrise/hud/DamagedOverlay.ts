import * as Pixi from "pixi.js";
import { Container, Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { clamp, smoothStep } from "../../core/util/MathUtil";
import { Layer } from "../config/layers";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";
import frag_damageFilter from "./damage-filter.frag";

const FLASH_ALPHA = 0.4;

export class DamagedOverlay extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  sprite: Container & GameSprite;
  colorFilter: Pixi.Filter;

  constructor(private getPlayer: () => Human | undefined) {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.HUD;

    this.colorFilter = new Pixi.Filter(undefined, frag_damageFilter, {
      healthPercent: 1.0,
    });
  }

  onAdd(game: Game) {
    game.renderer.addStageFilter(this.colorFilter);
  }

  onDestroy(game: Game) {
    game.renderer.removeStageFilter(this.colorFilter);
  }

  handlers = {
    humanInjured: ({ human, amount }: { human: Human; amount: number }) => {
      if (human === this.getPlayer()) {
        this.flash(0xff0000, 0, 0.4);
      }
    },

    humanHealed: ({ human, amount }: { human: Human; amount: number }) => {
      if (human === this.getPlayer()) {
        this.flash(0x00ff00, 0.0, 0.8);
      }
    },
  };

  onRender() {
    const human = this.getPlayer();
    if (human && !human.isDestroyed) {
      this.updateBaseline(human.hp / human.maxHp);
    } else {
      this.updateBaseline(0.0);
    }
  }

  updateBaseline(healthPercent: number) {
    this.colorFilter.uniforms.healthPercent = healthPercent;
  }

  makeOverlay(color: number = 0xff0000): Graphics {
    const [width, height] = this.game!.renderer.getSize();
    return new Graphics()
      .clear()
      .beginFill(color)
      .drawRect(0, 0, width, height)
      .endFill();
  }

  async flash(
    color: number,
    fadeInTime: number = 0,
    fadeOutTime: number = 0.4
  ) {
    const graphics = this.makeOverlay(color);
    this.sprite.addChild(graphics);
    await this.wait(fadeInTime, (dt, t) => {
      graphics.alpha = smoothStep(t * FLASH_ALPHA);
    });
    await this.wait(
      fadeOutTime,
      (dt, t) => {
        graphics.alpha = smoothStep((1 - t) * FLASH_ALPHA);
      },
      "flash"
    );
    this.sprite.removeChild(graphics);
  }
}

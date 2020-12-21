import { Container, Graphics, Sprite } from "pixi.js";
import img_healthOverlay from "../../../resources/images/effects/health-overlay.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { smoothStep } from "../../core/util/MathUtil";
import { Layer } from "../config/layers";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";

const FLASH_ALPHA = 0.4;

export class DamagedOverlay extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  sprite: Container & GameSprite;
  baseline!: Sprite;

  constructor(private getPlayer: () => Human | undefined) {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.HUD;
  }

  onAdd() {
    this.baseline = Sprite.from(img_healthOverlay);
    this.baseline.alpha = 0;
    this.sprite.addChild(this.baseline);
    this.resize();
  }

  resize() {
    const [width, height] = this.game!.renderer.getSize();
    this.baseline.width = width;
    this.baseline.height = height;
  }

  handlers = {
    resize: () => {
      this.resize();
    },

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
      this.updateBaseline(1.0);
    }
  }

  updateBaseline(healthPercent: number) {
    this.baseline.alpha = 1.0 - healthPercent;
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

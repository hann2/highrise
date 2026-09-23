import { Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { clamp } from "../../core/util/MathUtil";
import Interactable from "../environment/Interactable";

const COLOR = 0xfff1d6;
/** Seconds to fade in on something new */
const FADE_IN_TIME = 0.15;
/** Radians per second */
const PULSE_SPEED = 4;

/**
 * A soft pulsing ring on the floor around whatever the interact button would
 * use, so it reads as "this is what E does". Set `target` every frame (see
 * `InteractPrompt`); nothing shows while it's undefined.
 */
export default class InteractHighlight extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  target?: Interactable;
  private drawnTarget?: Interactable;
  private drawnRadius = 0;
  private shownSince = 0;

  constructor() {
    super();
    this.sprite = new Graphics();
    this.sprite.layerName = Layer.EMISSIVES;
    this.sprite.blendMode = "add";
    this.sprite.visible = false;
  }

  @on("render")
  onRender() {
    const target = this.target;
    if (!target || target.isDestroyed) {
      this.sprite.visible = false;
      this.drawnTarget = undefined;
      return;
    }

    const now = this.game.elapsedTime;
    if (target !== this.drawnTarget) {
      this.drawnTarget = target;
      this.shownSince = now;
    }
    if (target.highlightRadius !== this.drawnRadius) {
      this.drawnRadius = target.highlightRadius;
      this.draw(this.drawnRadius);
    }

    const fadeIn = clamp((now - this.shownSince) / FADE_IN_TIME, 0, 1);
    const pulse = Math.sin((now - this.shownSince) * PULSE_SPEED);
    this.sprite.visible = true;
    this.sprite.alpha = fadeIn * (0.7 + 0.3 * pulse);
    this.sprite.scale.set(1 + 0.04 * pulse);
    this.sprite.position.copyFrom(target.getPosition());
  }

  private draw(radius: number) {
    this.sprite
      .clear()
      // A faint glow inside the ring
      .circle(0, 0, radius)
      .fill({ color: COLOR, alpha: 0.05 })
      // A soft edge, then the ring itself
      .circle(0, 0, radius)
      .stroke({ width: 0.1, color: COLOR, alpha: 0.12 })
      .circle(0, 0, radius)
      .stroke({ width: 0.03, color: COLOR, alpha: 0.45 });
  }
}

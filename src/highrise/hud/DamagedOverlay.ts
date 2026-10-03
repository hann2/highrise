import {
  Container,
  defaultFilterVert,
  Filter,
  GlProgram,
  Graphics,
  UniformGroup,
} from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { smoothStep } from "../../core/util/MathUtil";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";
import { getSetting } from "../settings/SettingsController";
import frag_damageFilter from "./damage-filter.frag?raw";

const FLASH_ALPHA = 0.4;
/**
 * Above this fraction of their health the player sees no greying out, so the
 * filter does nothing and is taken off the stage (it's a pass over the whole
 * screen). It's where `damage-filter.frag`'s amount, 1 - 1.5 × health, is 0.
 */
const FILTER_FROM_HEALTH = 2 / 3;

/**
 * How hurt the player is: the screen greys out as their health goes down,
 * and flashes red when they're hurt and green when they're healed, as
 * strongly as the Damage Effect setting says.
 */
export class DamagedOverlay extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  sprite: Container & GameSprite;
  colorFilter: Filter;
  private uniforms = new UniformGroup({
    uHealthPercent: { value: 1.0, type: "f32" },
    uStrength: { value: 1.0, type: "f32" },
  });
  /** Whether `colorFilter` is on the stage */
  private filterOn = false;

  constructor(private getPlayer: () => Human | undefined) {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.HUD;

    // Desaturates the screen as the player gets closer to death
    this.colorFilter = new Filter({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment: frag_damageFilter,
        name: "damage-filter",
      }),
      resources: { damageUniforms: this.uniforms },
      // This has to match the renderer's resolution. Filters nested inside
      // of this one (like the blur on vision shadows) render nothing otherwise.
      resolution: "inherit",
    });
  }

  // `this.game` is gone by now, so the game comes from the event
  @on("destroy")
  onDestroy({ game }: { game: Game }) {
    this.setFilterOn(false, game);
  }

  private setFilterOn(on: boolean, game: Game = this.game) {
    if (on !== this.filterOn) {
      this.filterOn = on;
      if (on) {
        game.renderer.addStageFilter(this.colorFilter);
      } else {
        game.renderer.removeStageFilter(this.colorFilter);
      }
    }
  }

  /** 0 to 1, from the Damage Effect setting */
  private get strength(): number {
    return getSetting(this.game, "damageEffect");
  }

  @on("humanInjured")
  onHumanInjured({ human }: { human: Human }) {
    if (human === this.getPlayer()) {
      this.flash(0xff0000, 0, 0.4);
    }
  }

  @on("humanHealed")
  onHumanHealed({ human }: { human: Human }) {
    if (human === this.getPlayer()) {
      this.flash(0x00ff00, 0.0, 0.8);
    }
  }

  @on("render")
  onRender() {
    const human = this.getPlayer();
    if (human && !human.isDestroyed) {
      this.updateBaseline(human.hp / human.maxHp);
    } else {
      this.updateBaseline(0.0);
    }
  }

  updateBaseline(healthPercent: number) {
    const strength = this.strength;
    this.uniforms.uniforms.uHealthPercent = healthPercent;
    this.uniforms.uniforms.uStrength = strength;
    this.setFilterOn(strength > 0 && healthPercent < FILTER_FROM_HEALTH);
  }

  makeOverlay(color: number = 0xff0000): Graphics {
    const [width, height] = this.game.renderer.getSize();
    return new Graphics().rect(0, 0, width, height).fill(color);
  }

  async flash(
    color: number,
    fadeInTime: number = 0,
    fadeOutTime: number = 0.4,
  ) {
    const alpha = FLASH_ALPHA * this.strength;
    if (alpha <= 0) {
      return;
    }
    const graphics = this.makeOverlay(color);
    this.sprite.addChild(graphics);
    await this.wait(fadeInTime, (dt, t) => {
      graphics.alpha = smoothStep(t * alpha);
    });
    await this.wait(
      fadeOutTime,
      (dt, t) => {
        graphics.alpha = smoothStep((1 - t) * alpha);
      },
      "flash",
    );
    this.sprite.removeChild(graphics);
  }
}

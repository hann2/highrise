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
import frag_damageFilter from "./damage-filter.frag";

const FLASH_ALPHA = 0.4;

export class DamagedOverlay extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  sprite: Container & GameSprite;
  colorFilter: Filter;
  private uniforms = new UniformGroup({
    uHealthPercent: { value: 1.0, type: "f32" },
  });

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

  @on("add")
  onAdd({ game }: { game: Game }) {
    game.renderer.addStageFilter(this.colorFilter);
  }

  @on("destroy")
  onDestroy({ game }: { game: Game }) {
    game.renderer.removeStageFilter(this.colorFilter);
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
    this.uniforms.uniforms.uHealthPercent = healthPercent;
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
      "flash",
    );
    this.sprite.removeChild(graphics);
  }
}

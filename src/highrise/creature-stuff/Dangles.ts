import { Sprite } from "pixi.js";
import { Dangle, DangleStyle } from "../../core/animation/Dangle";
import { DangleTexture } from "../looks/bakeBodies";
import { DangleKind } from "../looks/dangles";

interface DangleFeel extends DangleStyle {
  /** How hard each footstep shoves it sideways (m/s), at a walk and up */
  step: number;
}

/** How each kind of thing swings */
export const DANGLE_STYLES: Record<DangleKind, DangleFeel> = {
  ponytail: {
    frequency: 1.6,
    dampingRatio: 0.22,
    drag: 1.5,
    maxAngle: 0.9,
    // It hangs down the back, so it's drawn shorter than it is: swung out
    // behind, all of it shows (`PONYTAIL_HANGING` in `head.ts`)
    minStretch: 0.6,
    maxStretch: 1.45,
    step: 0.25,
  },
  bun: {
    // Pinned up tight: a little wobble
    frequency: 3.5,
    dampingRatio: 0.3,
    drag: 0.2,
    maxAngle: 0.25,
    minStretch: 0.94,
    maxStretch: 1.1,
    step: 0.12,
  },
  lanyard: {
    frequency: 1.8,
    dampingRatio: 0.18,
    drag: 0.3,
    maxAngle: 0.5,
    // It can't swing back into the chest
    minStretch: 0.98,
    maxStretch: 1.25,
    step: 0.15,
  },
  tie: {
    frequency: 2,
    dampingRatio: 0.25,
    drag: 0.3,
    maxAngle: 0.35,
    minStretch: 0.97,
    maxStretch: 1.15,
    step: 0.1,
  },
  scarf: {
    frequency: 1.4,
    dampingRatio: 0.25,
    drag: 1.5,
    maxAngle: 0.6,
    minStretch: 0.8,
    maxStretch: 1.2,
    step: 0.2,
  },
  backpack: {
    frequency: 2.5,
    dampingRatio: 0.4,
    drag: 0,
    maxAngle: 0.15,
    minStretch: 0.96,
    maxStretch: 1.05,
    step: 0.08,
  },
};

/** Walking at least this fast (m/s), footsteps shove things as hard as they do */
const STEP_SPEED = 1.5;

interface Hanging {
  texture: DangleTexture;
  sprite: Sprite;
  dangle: Dangle;
  feel: DangleFeel;
}

/**
 * The things on a body that swing as it moves: a sprite for each, turned
 * and stretched about where it hangs from by its `Dangle`. Only looks: it's
 * moved on while the body's in view, by the game time since the last time.
 */
export class Dangles {
  private hanging: Hanging[];

  constructor(
    textures: DangleTexture[],
    /** Meters per texture pixel */
    private pixelScale: number,
    /** How big the body is next to a human */
    private sizeRatio: number,
  ) {
    this.hanging = textures.map((texture) => {
      const sprite = new Sprite(texture.texture);
      sprite.scale.set(pixelScale);
      const feel = DANGLE_STYLES[texture.kind];
      return {
        texture,
        sprite,
        feel,
        dangle: new Dangle(feel, texture.length * sizeRatio),
      };
    });
  }

  /** The sprites of the things hanging off `on`, under it or `above` it, in the order they're drawn */
  sprites(on: "head" | "torso", above = false): Sprite[] {
    return this.hanging
      .filter((h) => h.texture.on === on && h.texture.above === above)
      .map((h) => h.sprite);
  }

  get count() {
    return this.hanging.length;
  }

  /**
   * Moves them on by `dt` seconds of game time, the body being at `x`, `y`
   * facing `facing`, with its torso turned `torsoAngle` from that
   */
  update(x: number, y: number, facing: number, torsoAngle: number, dt: number) {
    for (const { texture, dangle } of this.hanging) {
      const parent = texture.on === "torso" ? torsoAngle : 0;
      const [px, py] = this.pivot(texture, parent);
      const cos = Math.cos(facing);
      const sin = Math.sin(facing);
      dangle.update(
        x + px * cos - py * sin,
        y + px * sin + py * cos,
        facing + parent + texture.angle,
        dt,
      );
    }
  }

  /** Puts the sprites where they're swinging to, in the body's own frame */
  pose(torsoAngle: number) {
    for (const { texture, sprite, dangle } of this.hanging) {
      const parent = texture.on === "torso" ? torsoAngle : 0;
      const [px, py] = this.pivot(texture, parent);
      sprite.position.set(px, py);
      sprite.rotation = parent + texture.angle + dangle.angle;
      sprite.scale.x = this.pixelScale * dangle.stretch;
    }
  }

  /** Shoves every one of them (m/s, in the world) */
  push(vx: number, vy: number) {
    for (const { dangle } of this.hanging) {
      dangle.push(vx, vy);
    }
  }

  /**
   * A foot landing shoves them toward the other side, as the body's weight
   * goes over onto it
   */
  step(side: 0 | 1, facing: number, speed: number) {
    const strength = Math.min(1, speed / STEP_SPEED);
    // The left foot (0) is toward -y in the body's frame
    const away = side === 0 ? 1 : -1;
    const ax = -Math.sin(facing) * away;
    const ay = Math.cos(facing) * away;
    for (const { dangle, feel } of this.hanging) {
      const shove = feel.step * strength * this.sizeRatio;
      dangle.push(ax * shove, ay * shove);
    }
  }

  setVisible(on: "head" | "torso", visible: boolean) {
    for (const { texture, sprite } of this.hanging) {
      if (texture.on === on) {
        sprite.visible = visible;
      }
    }
  }

  /** Where a dangle hangs from in the body's frame, its part turned `parent` */
  private pivot(texture: DangleTexture, parent: number): [number, number] {
    const x = texture.pivot[0] * this.sizeRatio;
    const y = texture.pivot[1] * this.sizeRatio;
    const cos = Math.cos(parent);
    const sin = Math.sin(parent);
    return [x * cos - y * sin, x * sin + y * cos];
  }
}

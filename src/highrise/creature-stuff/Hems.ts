import { MeshSimple } from "pixi.js";
import type { HemTexture } from "../looks/bakeBodies";
import type { HemKind } from "../looks/hems";
import {
  HemCloth,
  HemFeel,
  hemIndices,
  hemPictureAngles,
  hemRest,
  HemShape,
  hemUvs,
  LegAtHem,
  Oval,
} from "./hemCloth";

/** How each kind of cloth swings */
export const HEM_FEELS: Record<HemKind, HemFeel> = {
  skirt: {
    frequency: 1.8,
    dampingRatio: 0.3,
    drag: 0.7,
    maxSwing: 0.5,
  },
  coat: {
    // Heavier: slower, and it trails more
    frequency: 1.5,
    dampingRatio: 0.35,
    drag: 1,
    maxSwing: 0.45,
    // Each flap swings as one, either side of the vent
    bend: 3,
  },
};

/** Walking at least this fast (m/s), footsteps shove the hem as hard as they do */
const STEP_SPEED = 1.5;
/** How hard a footstep shoves the hem toward the other side (m/s) */
const STEP_SHOVE = 0.25;

/** A leg from the hip to the ankle, in the world, and half its thickness */
export interface LegLine {
  hipX: number;
  hipY: number;
  ankleX: number;
  ankleY: number;
  radius: number;
}

interface Hanging {
  texture: HemTexture;
  cloth: HemCloth;
  mesh: MeshSimple;
  vertices: Float32Array;
  /** Where its legs come through its hem, reused */
  legs: LegAtHem[];
}

/**
 * The cloth on a body hanging from round its waist (a skirt, a coat's
 * tails): a mesh for each, its hem swung by a `HemCloth`. Only looks: it's
 * moved on while the body's in view, by the game time since the last time.
 */
export class Hems {
  private hanging: Hanging[];

  constructor(
    textures: HemTexture[],
    /** Meters per texture pixel */
    pixelScale: number,
    /** How big the body is next to a human */
    private sizeRatio: number,
  ) {
    this.hanging = textures.map((texture) => {
      const shape = scaled(texture.shape, sizeRatio);
      const cloth = new HemCloth(shape, HEM_FEELS[texture.kind]);
      // The picture's origin, the middle of the waist, is the texture's anchor
      const { width, height } = texture.texture.frame;
      const anchor = texture.texture.defaultAnchor ?? { x: 0, y: 0 };
      const from: [number, number] = [
        -anchor.x * width * pixelScale,
        -anchor.y * height * pixelScale,
      ];
      const to: [number, number] = [
        from[0] + width * pixelScale,
        from[1] + height * pixelScale,
      ];
      const vertices = new Float32Array(cloth.rest);
      const mesh = new MeshSimple({
        texture: texture.texture,
        vertices,
        uvs: hemUvs(
          hemRest(shape, hemPictureAngles(shape, cloth.angles)),
          from,
          to,
        ),
        indices: hemIndices(shape, cloth.count),
      });
      // Its vertices are marked changed when it's posed, not every frame by
      // a callback of its own, which Pixi calls for every mesh, in view or not
      mesh.autoUpdate = false;
      mesh.onRender = null;
      return { texture, cloth, mesh, vertices, legs: [] };
    });
  }

  get count() {
    return this.hanging.length;
  }

  /** The meshes, in the order they're drawn */
  get meshes(): MeshSimple[] {
    return this.hanging.map((h) => h.mesh);
  }

  /**
   * Moves them on by `dt` seconds of game time, the middle of the hips
   * being at `x`, `y`, the hips facing `hipAngle` and the torso
   * `torsoAngle` (in the world), with `legs` from the hips to the ankles:
   * a skirt hangs from the hips, and turns with them, a coat from the torso
   */
  update(
    x: number,
    y: number,
    hipAngle: number,
    torsoAngle: number,
    legs: readonly LegLine[],
    dt: number,
  ) {
    for (const { cloth, texture, legs: through } of this.hanging) {
      // Where each leg comes through the hem: as far from the hip to the
      // ankle as the hem is down the leg
      const drop = cloth.shape.drop;
      while (through.length < legs.length) {
        through.push({ x: 0, y: 0, radius: 0 });
      }
      through.length = legs.length;
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        through[i].x = leg.hipX + (leg.ankleX - leg.hipX) * drop;
        through[i].y = leg.hipY + (leg.ankleY - leg.hipY) * drop;
        through[i].radius = leg.radius;
      }
      cloth.update(
        x,
        y,
        texture.layer === "torso" ? torsoAngle : hipAngle,
        through,
        dt,
      );
    }
  }

  /** Puts the meshes where the hems are, for a body at `x`, `y` facing `facing` */
  pose(x: number, y: number, facing: number) {
    for (const { cloth, mesh, vertices } of this.hanging) {
      cloth.pose(x, y, facing, vertices);
      mesh.geometry.getBuffer("aPosition").update();
    }
  }

  /** Shoves every one of them (m/s, in the world) */
  push(vx: number, vy: number) {
    for (const { cloth } of this.hanging) {
      cloth.push(vx, vy);
    }
  }

  /** A foot landing shoves them toward the other side, as the weight goes over onto it */
  step(side: 0 | 1, facing: number, speed: number) {
    const strength = Math.min(1, speed / STEP_SPEED);
    // The left foot (0) is toward -y in the body's frame
    const away = side === 0 ? 1 : -1;
    const shove = STEP_SHOVE * strength * this.sizeRatio;
    this.push(
      -Math.sin(facing) * away * shove,
      Math.cos(facing) * away * shove,
    );
  }

  setVisible(layer: "legs" | "torso", visible: boolean) {
    for (const { texture, mesh } of this.hanging) {
      if (texture.layer === layer) {
        mesh.visible = visible;
      }
    }
  }
}

/** `shape` for a body `ratio` times a human's size */
function scaled(shape: HemShape, ratio: number): HemShape {
  const oval = (o: Oval): Oval => ({
    front: o.front * ratio,
    back: o.back * ratio,
    side: o.side * ratio,
  });
  return {
    ...shape,
    waist: oval(shape.waist),
    hem: oval(shape.hem),
    margin: shape.margin * ratio,
    cloth: shape.cloth * ratio,
  };
}

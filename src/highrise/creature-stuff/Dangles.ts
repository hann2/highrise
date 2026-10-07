import { MeshSimple, Sprite } from "pixi.js";
import { Dangle, DangleStyle } from "../../core/animation/Dangle";
import { DangleChain } from "../../core/animation/DangleChain";
import { chainColumns, chainStrip } from "./chainStrip";
import { SleevePicture, sleeveIndices, sleeveUvs } from "./sleeveStrip";
import { DangleTexture } from "../looks/bakeBodies";
import { DangleKind } from "../looks/dangles";

interface DangleFeel extends DangleStyle {
  /** How hard each footstep shoves it sideways (m/s), at a walk and up */
  step: number;
  /**
   * Bends as it swings, as a chain of this many links (`DangleChain`),
   * each bending at most `bend` from the one before (radians); else it
   * swings stiffly, as one
   */
  links?: number;
  bend?: number;
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
    links: 3,
    bend: 0.5,
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
    // Stiff: from above, it's mostly under the head, so bending wouldn't show
  },
  scarf: {
    frequency: 1.4,
    dampingRatio: 0.25,
    drag: 1.5,
    maxAngle: 0.6,
    minStretch: 0.8,
    maxStretch: 1.2,
    step: 0.2,
    links: 2,
    bend: 0.5,
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
  feel: DangleFeel;
  /** A sprite swung by one `Dangle`, if it swings stiffly */
  sprite?: Sprite;
  dangle?: Dangle;
  /** A strip bent along a `DangleChain`, if it bends */
  bent?: Bent;
}

/** Something that bends as it swings: its strip, and the chain it's laid along */
interface Bent {
  mesh: MeshSimple;
  chain: DangleChain;
  /** The mesh's own vertices, posed in place */
  vertices: Float32Array;
  /** Where along the picture each column of the strip is */
  along: Float64Array;
  picture: SleevePicture;
  /** From its pivot to its tip, at rest (m) */
  length: number;
  /** The chain's joints in the body's frame, from the pivot to the tip */
  joints: Float64Array;
}

/**
 * The things on a body that swing as it moves: a sprite for each that
 * swings stiffly, turned and stretched about where it hangs from by its
 * `Dangle`, and a strip for each that bends (`DANGLE_STYLES`' `links`),
 * laid along a `DangleChain`. Only looks: they're moved on while the body's
 * in view, by the game time since the last time.
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
      const feel = DANGLE_STYLES[texture.kind];
      const length = texture.length * sizeRatio;
      if (feel.links && feel.links > 1) {
        return {
          texture,
          feel,
          bent: makeBent(texture, feel, length, pixelScale),
        };
      }
      const sprite = new Sprite(texture.texture);
      sprite.scale.set(pixelScale);
      return { texture, feel, sprite, dangle: new Dangle(feel, length) };
    });
  }

  /** What's drawn of the things hanging off `on`, under it or `above` it, in the order they're drawn */
  sprites(on: "head" | "torso", above = false): (Sprite | MeshSimple)[] {
    return this.hanging
      .filter((h) => h.texture.on === on && h.texture.above === above)
      .map((h) => h.bent?.mesh ?? h.sprite!);
  }

  get count() {
    return this.hanging.length;
  }

  /**
   * Moves them on by `dt` seconds of game time, the body being at `x`, `y`
   * facing `facing`, with its torso turned `torsoAngle` from that
   */
  update(x: number, y: number, facing: number, torsoAngle: number, dt: number) {
    const cos = Math.cos(facing);
    const sin = Math.sin(facing);
    for (const { texture, dangle, bent } of this.hanging) {
      const parent = texture.on === "torso" ? torsoAngle : 0;
      const [px, py] = this.pivot(texture, parent);
      const wx = x + px * cos - py * sin;
      const wy = y + px * sin + py * cos;
      const rest = facing + parent + texture.angle;
      dangle?.update(wx, wy, rest, dt);
      bent?.chain.update(wx, wy, rest, dt);
    }
  }

  /** Puts them where they're swinging to, in the body's own frame */
  pose(torsoAngle: number) {
    for (const { texture, sprite, dangle, bent } of this.hanging) {
      const parent = texture.on === "torso" ? torsoAngle : 0;
      const [px, py] = this.pivot(texture, parent);
      if (sprite && dangle) {
        sprite.position.set(px, py);
        sprite.rotation = parent + texture.angle + dangle.angle;
        sprite.scale.x = this.pixelScale * dangle.stretch;
      }
      if (bent) {
        // Each link from the end of the one before, turned as much more as
        // it's swung, and as long as it looks
        const { joints, chain } = bent;
        let angle = parent + texture.angle;
        let jx = px;
        let jy = py;
        joints[0] = jx;
        joints[1] = jy;
        for (let i = 0; i < chain.links.length; i++) {
          const link = chain.links[i];
          angle += link.angle;
          const reach = link.length * link.stretch;
          jx += Math.cos(angle) * reach;
          jy += Math.sin(angle) * reach;
          joints[i * 2 + 2] = jx;
          joints[i * 2 + 3] = jy;
        }
        chainStrip(
          bent.picture,
          bent.length,
          joints,
          bent.along,
          bent.vertices,
        );
        bent.mesh.geometry.getBuffer("aPosition").update();
      }
    }
  }

  /** Shoves every one of them (m/s, in the world) */
  push(vx: number, vy: number) {
    for (const { dangle, bent } of this.hanging) {
      dangle?.push(vx, vy);
      bent?.chain.push(vx, vy);
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
    for (const { dangle, bent, feel } of this.hanging) {
      const shove = feel.step * strength * this.sizeRatio;
      dangle?.push(ax * shove, ay * shove);
      bent?.chain.push(ax * shove, ay * shove);
    }
  }

  setVisible(on: "head" | "torso", visible: boolean) {
    for (const { texture, sprite, bent } of this.hanging) {
      if (texture.on === on) {
        (bent?.mesh ?? sprite!).visible = visible;
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

/**
 * A strip for `texture`'s picture, hanging `length` from its pivot (its
 * anchor) to its tip, drawn `pixelScale` meters a pixel, and the chain it's
 * laid along
 */
function makeBent(
  texture: DangleTexture,
  feel: DangleFeel,
  length: number,
  pixelScale: number,
): Bent {
  const { width, height } = texture.texture.frame;
  const anchor = texture.texture.defaultAnchor ?? { x: 0, y: 0 };
  const picture: SleevePicture = {
    from: -anchor.x * width * pixelScale,
    to: (1 - anchor.x) * width * pixelScale,
    top: -anchor.y * height * pixelScale,
    bottom: (1 - anchor.y) * height * pixelScale,
  };
  const along = chainColumns(picture);
  const vertices = new Float32Array(along.length * 4);
  const mesh = new MeshSimple({
    texture: texture.texture,
    vertices,
    uvs: sleeveUvs(picture, along),
    indices: sleeveIndices(along.length),
  });
  // Its vertices are marked changed when it's posed, not every frame by a
  // callback of its own, which Pixi calls for every mesh, in view or not
  mesh.autoUpdate = false;
  mesh.onRender = null;
  const links = feel.links!;
  return {
    mesh,
    chain: new DangleChain(feel, length, links, feel.bend ?? feel.maxAngle),
    vertices,
    along,
    picture,
    length,
    joints: new Float64Array((links + 1) * 2),
  };
}

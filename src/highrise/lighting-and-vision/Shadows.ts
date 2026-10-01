import { Container, Matrix, RenderTexture, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { profiler } from "../../core/util/Profiler";
import { V2d } from "../../core/Vector";
import { LIGHT_RESOLUTION } from "./lightingConstants";
import LightingManager from "./LightingManager";
import { getShadowCasters } from "./occluders";
import { ShadowCasters } from "./ShadowCasters";

export interface ShadowsOptions {
  /** Where the light is, in world coordinates */
  position: V2d;
  /** How far from the light shadows are computed, in meters */
  radius?: number;
  /** Radius of the light source in meters. 0 gives hard shadows. */
  sourceRadius?: number;
  /** Pixels per meter of the mask */
  resolution?: number;
}

/**
 * Computes how much of the light from a point (or a small disc, for soft
 * shadows) is blocked at every point nearby, as a texture: `maskSprite` is a
 * square of `2 * radius` meters centered on the light whose alpha is the
 * fraction of light blocked. Lights erase with it.
 *
 * The walls are drawn into it by the GPU in one draw call: `ShadowCasters`
 * keeps every static caster's edges in one mesh, which its shader turns into
 * shadows from this light, working out per pixel how much of the light's disc
 * each edge hides (so umbra and penumbra come out of the same calculation).
 * Coverage is added up, since compositing edges one over another would leak
 * light wherever two half-covered ones meet. Hard shadows are a disc of a
 * pixel, which antialiases their edges.
 *
 * Moving bodies (doors) don't cast shadows from lights.
 */
export class Shadows extends BaseEntity implements Entity {
  dirty: boolean = true;
  /**
   * The shadow mask. Coordinates are relative to the light. (Not called
   * `sprite`, which the Game would register as this entity's own display
   * object and put in a layer of its own.)
   */
  maskSprite: Sprite;
  private maskTexture: RenderTexture;
  /** The casters' version the mask was drawn with */
  private castersVersion = -1;
  private transform = new Matrix();

  private lightPos: V2d;
  private radius: number;
  private sourceRadius: number;
  private resolution: number;

  constructor({
    position,
    radius = 10,
    sourceRadius = 0,
    resolution = LIGHT_RESOLUTION,
  }: ShadowsOptions) {
    super();
    this.lightPos = position;
    this.radius = radius;
    this.sourceRadius = sourceRadius;
    this.resolution = resolution;

    this.maskTexture = RenderTexture.create({
      width: radius * 2,
      height: radius * 2,
      resolution,
    });
    this.maskSprite = new Sprite(this.maskTexture);
    this.maskSprite.anchor.set(0.5);
  }

  private get casters(): ShadowCasters {
    return this.game.entities.getSingleton(LightingManager).shadowCasters;
  }

  /** Whether the mask needs drawing again: the light changed, or the walls did */
  get needsUpdate(): boolean {
    return this.dirty || this.castersVersion !== this.casters.version;
  }

  setPosition(position: V2d) {
    if (!this.lightPos.equals(position)) {
      this.lightPos = position;
      this.dirty = true;
    }
  }

  setRadius(radius: number) {
    if (radius !== this.radius) {
      this.radius = radius;
      this.maskTexture.resize(radius * 2, radius * 2);
      this.dirty = true;
    }
  }

  setResolution(resolution: number) {
    if (resolution !== this.resolution) {
      this.resolution = resolution;
      this.maskTexture.resize(this.radius * 2, this.radius * 2, resolution);
      this.dirty = true;
    }
  }

  setSourceRadius(sourceRadius: number) {
    if (sourceRadius !== this.sourceRadius) {
      this.sourceRadius = sourceRadius;
      this.dirty = true;
    }
  }

  /** How many shapes near the light cast shadows (for benchmarks) */
  countCasterShapes(): number {
    let count = 0;
    for (const body of getShadowCasters(
      this.game,
      this.lightPos,
      this.radius,
      false,
    )) {
      count += body.shapes.length;
    }
    return count;
  }

  @on("destroy")
  onDestroy() {
    // Whoever displayed the sprite may have destroyed it with their own tree
    if (!this.maskSprite.destroyed) {
      this.maskSprite.destroy();
    }
    this.maskTexture.destroy(true);
  }

  updateIfNeeded() {
    if (this.needsUpdate) {
      this.forceUpdate();
    }
  }

  forceUpdate() {
    const casters = this.casters;
    profiler.measure("Shadows.renderMask", () => {
      const renderer = this.game.renderer.app.renderer;
      if (casters.isEmpty) {
        renderer.render({
          container: EMPTY,
          target: this.maskTexture,
          clear: true,
          clearColor: [0, 0, 0, 0],
        });
        return;
      }
      casters.setLight(
        this.lightPos[0],
        this.lightPos[1],
        this.radius,
        // At least a pixel, which antialiases hard shadows
        Math.max(this.sourceRadius, 1 / this.resolution),
      );
      this.transform.set(1, 0, 0, 1, this.radius, this.radius);
      renderer.render({
        container: casters.mesh,
        target: this.maskTexture,
        clear: true,
        // The default clear color is the renderer's opaque background
        clearColor: [0, 0, 0, 0],
        transform: this.transform,
      });
    });

    this.castersVersion = casters.version;
    this.dirty = false;
  }
}

const EMPTY = new Container();

import {
  Container,
  Graphics,
  Matrix,
  Mesh,
  MeshGeometry,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import type { Body } from "../../core/physics/body/Body";
import { AABB } from "../../core/physics/collision/AABB";
import { profiler } from "../../core/util/Profiler";
import { V2d } from "../../core/Vector";
import { LIGHT_RESOLUTION } from "./lightingConstants";
import { getShapeCorners } from "./shapeUtils";

/** Entities with this tag block light and vision */
export const CAST_SHADOW_TAG = "cast_shadow";

type Point = [number, number];

export interface ShadowsOptions {
  /** Where the light is, in world coordinates */
  position: V2d;
  /** How far from the light shadows are computed, in meters */
  radius?: number;
  /** Whether moving bodies (doors) cast shadows too */
  checkDynamicBodies?: boolean;
  /** Radius of the light source in meters. 0 gives hard shadows. */
  sourceRadius?: number;
  /** Pixels per meter of the mask */
  resolution?: number;
}

/** One wedge of partial shadow: the corner it starts at, the edge of full shadow, and the edge of full light */
interface Penumbra {
  corner: Point;
  umbraEdge: Point;
  litEdge: Point;
}

/**
 * Computes how much of the light from a point (or a small disc, for soft
 * shadows) is blocked at every point nearby, as a texture: `maskSprite` is a
 * square of `2 * radius` meters centered on the light whose alpha is the
 * fraction of light blocked. Lights erase with it; vision draws it in black.
 *
 * Each convex occluder produces an umbra polygon: its lit face plus the
 * silhouette corners projected away from the light. With a light of nonzero
 * radius, each silhouette corner also gets a penumbra wedge whose coverage
 * fades from the umbra edge to the lit edge. The wedges are one textured mesh
 * sharing an angular gradient texture, so a whole level's worth of soft
 * shadows costs no extra textures.
 *
 * Coverage is accumulated additively into the mask. Compositing occluders
 * one over another instead would leak light wherever two of them touch,
 * since two half-covered wedges only add up to three quarters.
 *
 * Resources:
 * https://www.redblobgames.com/articles/visibility/
 * https://archive.gamedev.net/archive/reference/programming/features/2dsoftshadow/page3.html
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
  /** The shadow geometry that gets rendered into the mask */
  private geometryContainer = new Container();
  private umbraGraphics = new Graphics();
  private penumbraGeometry = new MeshGeometry({
    positions: new Float32Array(0),
    uvs: new Float32Array(0),
    indices: new Uint32Array(0),
  });
  private penumbraMesh = new Mesh({
    geometry: this.penumbraGeometry,
    texture: getPenumbraTexture(),
  });

  private lightPos: V2d;
  private radius: number;
  private checkDynamicBodies: boolean;
  private sourceRadius: number;
  private resolution: number;

  constructor({
    position,
    radius = 10,
    checkDynamicBodies = false,
    sourceRadius = 0,
    resolution = LIGHT_RESOLUTION,
  }: ShadowsOptions) {
    super();
    this.lightPos = position;
    this.radius = radius;
    this.checkDynamicBodies = checkDynamicBodies;
    this.sourceRadius = sourceRadius;
    this.resolution = resolution;

    this.umbraGraphics.blendMode = "add";
    this.penumbraMesh.blendMode = "add";
    this.geometryContainer.addChild(this.umbraGraphics, this.penumbraMesh);

    this.maskTexture = RenderTexture.create({
      width: radius * 2,
      height: radius * 2,
      resolution,
      antialias: true,
    });
    this.maskSprite = new Sprite(this.maskTexture);
    this.maskSprite.anchor.set(0.5);
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

  @on("destroy")
  onDestroy() {
    this.geometryContainer.destroy({ children: true });
    // Whoever displayed the sprite may have destroyed it with their own tree
    if (!this.maskSprite.destroyed) {
      this.maskSprite.destroy();
    }
    this.maskTexture.destroy(true);
  }

  updateIfDirty() {
    if (this.dirty) {
      this.forceUpdate();
    }
  }

  forceUpdate() {
    const { umbras, penumbras } = profiler.measure("Shadows.geometry", () =>
      this.getShadowGeometry(),
    );

    profiler.measure("Shadows.draw", () => {
      this.umbraGraphics.clear();
      for (const corners of umbras) {
        this.umbraGraphics.poly(corners.flat()).fill(0xffffff);
      }
      this.drawPenumbras(penumbras);
    });

    profiler.measure("Shadows.renderMask", () => {
      const transform = new Matrix().translate(this.radius, this.radius);
      this.game.renderer.app.renderer.render({
        container: this.geometryContainer,
        target: this.maskTexture,
        clear: true,
        // The default clear color is the renderer's opaque background
        clearColor: [0, 0, 0, 0],
        transform,
      });
    });

    this.dirty = false;
  }

  private drawPenumbras(penumbras: Penumbra[]) {
    this.penumbraMesh.visible = penumbras.length > 0;
    if (penumbras.length === 0) {
      return;
    }
    const positions = new Float32Array(penumbras.length * 6);
    const uvs = new Float32Array(penumbras.length * 6);
    const indices = new Uint32Array(penumbras.length * 3);
    for (let i = 0; i < penumbras.length; i++) {
      const { corner, umbraEdge, litEdge } = penumbras[i];
      const p = i * 6;
      positions[p] = corner[0];
      positions[p + 1] = corner[1];
      positions[p + 2] = umbraEdge[0];
      positions[p + 3] = umbraEdge[1];
      positions[p + 4] = litEdge[0];
      positions[p + 5] = litEdge[1];
      // See getPenumbraTexture for what these coordinates mean
      uvs[p] = 0;
      uvs[p + 1] = 0;
      uvs[p + 2] = 1;
      uvs[p + 3] = 0;
      uvs[p + 4] = 1;
      uvs[p + 5] = 1;
      indices[i * 3] = i * 3;
      indices[i * 3 + 1] = i * 3 + 1;
      indices[i * 3 + 2] = i * 3 + 2;
    }
    // Set uvs first: the geometry expects them to be at least as long as positions
    this.penumbraGeometry.uvs = uvs;
    this.penumbraGeometry.positions = positions;
    this.penumbraGeometry.indices = indices;
  }

  private getShadowGeometry(): { umbras: Point[][]; penumbras: Penumbra[] } {
    const [lightX, lightY] = this.lightPos;
    const sourceRadius = this.sourceRadius;
    const umbras: Point[][] = [];
    const penumbras: Penumbra[] = [];
    // Far enough past the edge of the light that the end of the shadow is never visible
    const shadowDistance = 10 * this.radius;

    // The point you get by going from `from` through `point` for `shadowDistance`
    const project = (point: V2d, fromX: number, fromY: number): Point => {
      const dx = point[0] - fromX;
      const dy = point[1] - fromY;
      const scale = shadowDistance / (Math.hypot(dx, dy) || 1);
      return [point[0] - lightX + dx * scale, point[1] - lightY + dy * scale];
    };
    const relative = (point: V2d): Point => [
      point[0] - lightX,
      point[1] - lightY,
    ];

    for (const body of this.getAffectedBodies()) {
      for (const shape of body.shapes) {
        const corners = getShapeCorners(shape, body);
        const n = corners.length;
        if (n < 2) {
          continue;
        }

        // Which edges face the light
        const edgesVisible: boolean[] = [];
        let centerX = 0;
        let centerY = 0;
        for (let i = 0; i < n; i++) {
          const a = corners[i];
          const b = corners[(i + 1) % n];
          const normalX = b[1] - a[1];
          const normalY = -(b[0] - a[0]);
          const dot = (a[0] - lightX) * normalX + (a[1] - lightY) * normalY;
          edgesVisible.push(dot <= 0);
          centerX += a[0] / n;
          centerY += a[1] / n;
        }

        // The silhouette corners are where visibility changes. Walking the
        // corners in order, the first one starts the lit chain, the other ends it.
        let start = -1;
        let end = -1;
        for (let i = 0; i < n; i++) {
          const previousEdge = edgesVisible[(i + n - 1) % n];
          const nextEdge = edgesVisible[i];
          if (!previousEdge && nextEdge) {
            start = i;
          } else if (previousEdge && !nextEdge) {
            end = i;
          }
        }
        if (start < 0 || end < 0) {
          // The light is inside the shape (or on it); nothing sensible to draw
          continue;
        }

        // The shadow's interior is on the side of each silhouette ray that the
        // shape's center is on. Umbra edges tilt toward it, lit edges away.
        const sideOf = (point: V2d) =>
          Math.sign(
            (point[0] - lightX) * (centerY - lightY) -
              (point[1] - lightY) * (centerX - lightX),
          );
        const projectSilhouette = (
          point: V2d,
        ): { umbra: Point; lit: Point } => {
          if (sourceRadius === 0) {
            const hard = project(point, lightX, lightY);
            return { umbra: hard, lit: hard };
          }
          // Offset the source perpendicular to the ray, toward the interior
          // for the lit edge (whose ray then tilts away from it) and the
          // other way for the umbra edge.
          const dx = point[0] - lightX;
          const dy = point[1] - lightY;
          const length = Math.hypot(dx, dy) || 1;
          const side = sideOf(point) || 1;
          const offsetX = (-dy / length) * sourceRadius * side;
          const offsetY = (dx / length) * sourceRadius * side;
          return {
            umbra: project(point, lightX - offsetX, lightY - offsetY),
            lit: project(point, lightX + offsetX, lightY + offsetY),
          };
        };

        const startProjected = projectSilhouette(corners[start]);
        const endProjected = projectSilhouette(corners[end]);

        const umbra: Point[] = [startProjected.umbra];
        for (let i = start; ; i = (i + 1) % n) {
          umbra.push(relative(corners[i]));
          if (i === end) {
            break;
          }
        }
        umbra.push(endProjected.umbra);
        umbras.push(umbra);

        if (sourceRadius > 0) {
          penumbras.push({
            corner: relative(corners[start]),
            umbraEdge: startProjected.umbra,
            litEdge: startProjected.lit,
          });
          penumbras.push({
            corner: relative(corners[end]),
            umbraEdge: endProjected.umbra,
            litEdge: endProjected.lit,
          });
        }
      }
    }

    return { umbras, penumbras };
  }

  // Returns the nearby bodies that cast a shadow
  getAffectedBodies(): Body[] {
    const center = this.lightPos;
    const world = this.game.world;
    const aabb = new AABB({
      lowerBound: center.sub([this.radius, this.radius]),
      upperBound: center.add([this.radius, this.radius]),
    });
    const result: Body[] = [];

    // Static casters (walls) come from the broadphase hash. Asking it for
    // moving bodies too would make it hash every dynamic body in the world
    // for each query, and only a handful of them (doors) cast shadows.
    for (const body of world.broadphase.aabbQuery(world, aabb, false)) {
      if (body.owner?.tags?.includes(CAST_SHADOW_TAG)) {
        result.push(body);
      }
    }

    if (this.checkDynamicBodies) {
      for (const entity of this.game.entities.getTagged(CAST_SHADOW_TAG)) {
        const body = entity.body;
        if (body && body.motion !== "static" && body.getAABB().overlaps(aabb)) {
          result.push(body);
        }
      }
    }

    return result;
  }
}

const PENUMBRA_TEXTURE_SIZE = 128;
let penumbraTexture: Texture | undefined;

/**
 * An angular gradient for penumbra wedges. A wedge triangle gets texture
 * coordinates (0,0) at the occluder's corner, (1,0) at the far end of its
 * umbra edge and (1,1) at the far end of its lit edge. Coverage then depends
 * only on the angle from the corner: fully covered along v = 0, uncovered
 * along v = u. Because texture coordinates interpolate linearly across the
 * triangle, that angle is exact everywhere in the wedge.
 */
function getPenumbraTexture(): Texture {
  if (!penumbraTexture) {
    const size = PENUMBRA_TEXTURE_SIZE;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x + 0.5) / size;
        const v = (y + 0.5) / size;
        const t = Math.min(1, v / u);
        // Smooth falloff, roughly the fraction of a disc light that is hidden
        const alpha = 1 - t * t * (3 - 2 * t);
        const i = (y * size + x) * 4;
        image.data[i] = 255;
        image.data[i + 1] = 255;
        image.data[i + 2] = 255;
        image.data[i + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(image, 0, 0);
    penumbraTexture = Texture.from(canvas);
    penumbraTexture.source.addressMode = "clamp-to-edge";
    penumbraTexture.source.scaleMode = "linear";
  }
  return penumbraTexture;
}

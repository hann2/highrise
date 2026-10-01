import {
  Buffer,
  BufferUsage,
  GlProgram,
  Mesh,
  MeshGeometry,
  Renderer,
  RenderTexture,
  Shader,
} from "pixi.js";
import Game from "../../core/Game";
import type { Body } from "../../core/physics/body/Body";
import type Light from "./Light";
import { LIGHT_RESOLUTION } from "./lightingConstants";
import { CAST_SHADOW_TAG } from "./occluders";
import frag_shadowMask from "./shadowMask.frag?raw";
import vert_shadowMask from "./shadowMask.vert?raw";
import { getShapeCorners } from "./shapeUtils";

/** Vertices per wall edge: its two corners, and the two far ends of its shadow */
const EDGE_VERTICES = 4;
/** `aCorner` of the corners of a shape's interior */
const SOLID_CORNER = 4;

/**
 * Every static shadow caster's edges (and interiors) as one mesh that stays
 * on the GPU, for drawing the shadow masks of a whole page of the light atlas
 * in one draw call: it's drawn once per light (instanced), and the vertex
 * shader turns each edge into its shadow from that light, in that light's
 * square of the page, while the fragment shader works out how much of the
 * light each edge hides (`shadowMask.vert`, `shadowMask.frag`). Rebuilt only
 * when the set of casters changes (a new level), so drawing masks costs the
 * CPU nothing per wall.
 *
 * Moving casters (doors) don't cast shadows from lights.
 */
export class ShadowCasters {
  readonly mesh: Mesh<MeshGeometry, Shader>;
  /** The casters the mesh was built from */
  private bodies = new Set<Body>();
  /** Per light: x, y of the light; half the size of its square and its source radius; x, y of the middle of its square in the page */
  private lightData = new Float32Array(0);
  private lightBuffer = new Buffer({
    data: new Float32Array(6),
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
  });
  /** `WEBGL_clip_cull_distance`, once asked for (null where it's missing) */
  private clipExtension?: { CLIP_DISTANCE0_WEBGL: number } | null;

  constructor() {
    const glProgram = new GlProgram({
      vertex: vert_shadowMask,
      fragment: frag_shadowMask,
      name: "shadowMask",
    });
    // Clip planes (see `draw`) need the extension turned on in the shader,
    // before any code, which Pixi puts its own lines in front of: right
    // after the version line it adds. Where the extension is missing, this
    // only warns, and the shader doesn't write the clip distances.
    (glProgram as { vertex: string }).vertex = glProgram.vertex!.replace(
      /^#version 300 es\n/,
      "#version 300 es\n#extension GL_ANGLE_clip_cull_distance : enable\n",
    );
    const shader = new Shader({ glProgram, resources: {} });
    this.mesh = new Mesh({ geometry: this.buildGeometry([]), shader });
    this.mesh.blendMode = "add";
  }

  /** Whether there's nothing to cast shadows (the mesh can't be drawn then) */
  get isEmpty(): boolean {
    return this.mesh.geometry.indices.length === 0;
  }

  /** Rebuilds the mesh if casters were added or removed since the last call */
  update(game: Game) {
    const current: Body[] = [];
    let changed = false;
    for (const entity of game.entities.getTagged(CAST_SHADOW_TAG)) {
      const body = entity.body;
      if (body && body.motion === "static") {
        current.push(body);
        changed ||= !this.bodies.has(body);
      }
    }
    if (!changed && current.length === this.bodies.size) {
      return;
    }
    this.bodies = new Set(current);
    const old = this.mesh.geometry;
    this.mesh.geometry = this.buildGeometry(current);
    // All of its buffers but the lights', which the new one shares
    for (const name of ["aPosition", "aUV", "aNormal", "aCorner"]) {
      old.getBuffer(name).destroy();
    }
    old.indexBuffer.destroy();
    old.destroy();
  }

  /**
   * Draws the shadow masks of `lights`, which have their slots, into
   * `target`, a page of the mask atlas.
   *
   * Each light's shadows reach well past its square, which a texture of its
   * own would clip for free (the GPU clips triangles to the render target
   * before it shades a pixel), but the page doesn't. So with
   * `WEBGL_clip_cull_distance` the vertex shader gives the GPU four clip
   * planes per light, the edges of its square, and it clips to those
   * instead. Without the extension the fragment shader throws those pixels
   * away itself, which gives the same picture but costs a shader run each.
   */
  draw(renderer: Renderer, lights: readonly Light[], target: RenderTexture) {
    this.setLights(lights);
    const gl = (renderer as { gl?: WebGL2RenderingContext }).gl;
    this.clipExtension ??= gl?.getExtension("WEBGL_clip_cull_distance");
    const clip = this.clipExtension;
    if (gl && clip) {
      for (let i = 0; i < 4; i++) {
        gl.enable(clip.CLIP_DISTANCE0_WEBGL + i);
      }
    }
    renderer.render({
      container: this.mesh,
      target,
      clear: true,
      // The default clear color is the renderer's opaque background
      clearColor: [0, 0, 0, 0],
    });
    if (gl && clip) {
      // Off again: they'd apply to every other shader too
      for (let i = 0; i < 4; i++) {
        gl.disable(clip.CLIP_DISTANCE0_WEBGL + i);
      }
    }
  }

  /** Sets up the mesh to draw the masks of `lights`, which have their slots */
  private setLights(lights: readonly Light[]) {
    const needed = lights.length * 6;
    if (this.lightData.length < needed) {
      this.lightData = new Float32Array(
        Math.max(needed, 2 * this.lightData.length),
      );
    }
    const data = this.lightData;
    // At least a pixel, which antialiases hard shadows
    const minSourceRadius = 1 / LIGHT_RESOLUTION;
    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      const j = i * 6;
      data[j] = light.x;
      data[j + 1] = light.y;
      data[j + 2] = light.size / 2;
      data[j + 3] = Math.max(light.sourceRadius, minSourceRadius);
      data[j + 4] = light.slot!.x;
      data[j + 5] = light.slot!.y;
    }
    if (this.lightBuffer.data.length !== data.length) {
      this.lightBuffer.data = data;
    } else {
      this.lightBuffer.update(needed * 4);
    }
    this.mesh.geometry.instanceCount = lights.length;
  }

  destroy() {
    this.mesh.destroy();
    this.lightBuffer.destroy();
  }

  /** See `shadowMask.vert` for what the attributes mean */
  private buildGeometry(bodies: readonly Body[]): MeshGeometry {
    const first: number[] = [];
    const second: number[] = [];
    const normals: number[] = [];
    const cornerIds: number[] = [];
    const indices: number[] = [];
    const addVertex = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      nx: number,
      ny: number,
      corner: number,
    ) => {
      first.push(ax, ay);
      second.push(bx, by);
      normals.push(nx, ny);
      cornerIds.push(corner);
    };
    const addEdge = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      nx: number,
      ny: number,
    ) => {
      const start = cornerIds.length;
      for (let corner = 0; corner < EDGE_VERTICES; corner++) {
        addVertex(ax, ay, bx, by, nx, ny, corner);
      }
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    };

    for (const body of bodies) {
      for (const shape of body.shapes) {
        const corners = getShapeCorners(shape, body);
        const n = corners.length;
        if (n < 2) {
          continue;
        }
        let cx = 0;
        let cy = 0;
        for (const [x, y] of corners) {
          cx += x / n;
          cy += y / n;
        }
        for (let i = 0; i < (n === 2 ? 1 : n); i++) {
          const [ax, ay] = corners[i];
          const [bx, by] = corners[(i + 1) % n];
          const length = Math.hypot(bx - ax, by - ay);
          if (length === 0) {
            continue;
          }
          let nx = (by - ay) / length;
          let ny = -(bx - ax) / length;
          if (n === 2) {
            // A line has no inside: it blocks from both sides
            addEdge(ax, ay, bx, by, nx, ny);
            addEdge(ax, ay, bx, by, -nx, -ny);
            continue;
          }
          if (nx * (ax - cx) + ny * (ay - cy) < 0) {
            nx = -nx;
            ny = -ny;
          }
          addEdge(ax, ay, bx, by, nx, ny);
        }
        if (n >= 3) {
          // The inside is always in shadow, as a fan of triangles, which
          // carry the shape's bounding box for culling
          const xs = corners.map(([x]) => x);
          const ys = corners.map(([, y]) => y);
          const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
          const [maxX, maxY] = [Math.max(...xs), Math.max(...ys)];
          const start = cornerIds.length;
          for (const [x, y] of corners) {
            addVertex(x, y, minX, minY, maxX, maxY, SOLID_CORNER);
          }
          for (let i = 1; i < n - 1; i++) {
            indices.push(start, start + i, start + i + 1);
          }
        }
      }
    }

    const geometry = new MeshGeometry({
      positions: new Float32Array(first),
      uvs: new Float32Array(second),
      indices: new Uint32Array(indices),
    });
    geometry.addAttribute("aNormal", {
      buffer: new Float32Array(normals),
      format: "float32x2",
    });
    geometry.addAttribute("aCorner", {
      buffer: new Float32Array(cornerIds),
      format: "float32",
    });
    // The lights, one per instance, interleaved
    geometry.addAttribute("aLight", {
      buffer: this.lightBuffer,
      format: "float32x2",
      stride: 24,
      offset: 0,
      instance: true,
    });
    geometry.addAttribute("aLightSize", {
      buffer: this.lightBuffer,
      format: "float32x2",
      stride: 24,
      offset: 8,
      instance: true,
    });
    geometry.addAttribute("aSlot", {
      buffer: this.lightBuffer,
      format: "float32x2",
      stride: 24,
      offset: 16,
      instance: true,
    });
    return geometry;
  }
}

import { GlProgram, Mesh, MeshGeometry, Shader } from "pixi.js";
import Game from "../../core/Game";
import type { Body } from "../../core/physics/body/Body";
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
 * on the GPU, for drawing any light's shadow mask in one draw call: the
 * vertex shader turns each edge into its shadow from the light in the
 * uniforms, and the fragment shader works out how much of the light it hides
 * (`shadowMask.vert`, `shadowMask.frag`). Rebuilt only when the set of
 * casters changes (a new level), so drawing a mask costs the CPU nothing per
 * wall.
 *
 * Moving casters (doors) don't cast shadows from lights, as before.
 */
export class ShadowCasters {
  readonly shader = new Shader({
    glProgram: GlProgram.from({
      vertex: vert_shadowMask,
      fragment: frag_shadowMask,
      name: "shadowMask",
    }),
    resources: {
      shadowUniforms: {
        uLight: { value: new Float32Array(2), type: "vec2<f32>" },
        uRadius: { value: 1, type: "f32" },
        uSourceRadius: { value: 0, type: "f32" },
      },
    },
  });
  readonly mesh: Mesh<MeshGeometry, Shader>;
  /** The casters the mesh was built from */
  private bodies = new Set<Body>();
  /** Goes up every time the mesh is rebuilt, so masks know to redraw */
  version = 0;

  constructor() {
    this.mesh = new Mesh({ geometry: buildGeometry([]), shader: this.shader });
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
    this.mesh.geometry = buildGeometry(current);
    old.destroy(true);
    this.version += 1;
  }

  /** Sets up the mesh to draw the mask of a light at `x`, `y` */
  setLight(x: number, y: number, radius: number, sourceRadius: number) {
    const uniforms = this.shader.resources.shadowUniforms.uniforms;
    uniforms.uLight[0] = x;
    uniforms.uLight[1] = y;
    uniforms.uRadius = radius;
    uniforms.uSourceRadius = sourceRadius;
  }

  destroy() {
    this.mesh.destroy();
    this.shader.destroy();
  }
}

/** See `shadowMask.vert` for what the attributes mean */
function buildGeometry(bodies: readonly Body[]): MeshGeometry {
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
    return cornerIds.length - 1;
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
        // The inside is always in shadow, as a fan of triangles
        const start = cornerIds.length;
        for (const [x, y] of corners) {
          addVertex(x, y, cx, cy, 0, 0, SOLID_CORNER);
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
  return geometry;
}

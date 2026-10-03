import { Mesh, MeshGeometry } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import type { Body } from "../../core/physics/body/Body";
import { V, V2d } from "../../core/Vector";
import ContactShadows from "./ContactShadows";
import {
  CONTACT_SHADOW_BORDER,
  CONTACT_SHADOW_TEXTURE_SIZE,
  getContactShadowTexture,
} from "./contactShadowTexture";

export interface ContactShadowOptions {
  /** Where the rectangle's middle is, in the world (or relative to `body`) */
  position?: V2d;
  /** Which way the rectangle's length points (or relative to `body`) */
  angle?: number;
  /** A body to move with, for things that move (doors) */
  body?: Body;
  /**
   * Everywhere one that moves can darken (min x, min y, max x, max y), if
   * it doesn't just swing around its body like a door (see `getArea`)
   */
  area?: [number, number, number, number];
}

/** Vertices in a shadow's mesh: a 4 × 4 grid, cut like a nine-slice sprite */
export const CONTACT_SHADOW_VERTICES = 16;
/** Indices in a shadow's mesh: two triangles for each of the nine quads */
export const CONTACT_SHADOW_INDICES = 54;

/** Where the texture is cut, the same both ways: its edges, and the rectangle's */
const UV_CUTS = [
  0,
  CONTACT_SHADOW_BORDER / CONTACT_SHADOW_TEXTURE_SIZE,
  1 - CONTACT_SHADOW_BORDER / CONTACT_SHADOW_TEXTURE_SIZE,
  1,
];

/**
 * A soft shadow on the floor around a rectangle (a wall, a door), where it
 * meets the floor. `ContactShadows` draws them all together, so where they
 * overlap the darkest one wins rather than adding up, and they join up at
 * corners however the level is shaped.
 *
 * Each is nine quads of the shadow texture, cut like a nine-slice sprite, so
 * it keeps its soft rounded ends at any size. Shadows that don't move are
 * built into meshes when they change; one that moves with a body is a mesh
 * of its own, which only has to be moved.
 */
export default class ContactShadow extends BaseEntity implements Entity {
  private manager?: ContactShadows;
  /** Where the quads' corners are, along the rectangle and across it */
  private cutsAlong: number[] = [];
  private cutsAcross: number[] = [];
  private position: V2d;
  private angle: number;
  private follow?: Body;
  /** How far from its middle it reaches, at the size it was made */
  private radius: number;
  private area?: [number, number, number, number];
  /** Its own mesh, around its middle, if it moves */
  private ownMesh?: Mesh;

  constructor(
    /** Along the rectangle, in meters */
    length: number,
    /** Across the rectangle, in meters */
    width: number,
    /** How far the shadow reaches past the rectangle's edges, in meters */
    private reach: number,
    { position = V(0, 0), angle = 0, body, area }: ContactShadowOptions = {},
  ) {
    super();
    this.position = position;
    this.angle = angle;
    this.follow = body;
    this.area = area;
    this.setCuts(length, width);
    this.radius = Math.hypot(length + 2 * reach, width + 2 * reach) / 2;
  }

  private setCuts(length: number, width: number) {
    const reach = this.reach;
    this.cutsAlong = [
      -length / 2 - reach,
      -length / 2,
      length / 2,
      length / 2 + reach,
    ];
    this.cutsAcross = [
      -width / 2 - reach,
      -width / 2,
      width / 2,
      width / 2 + reach,
    ];
  }

  /**
   * Changes the size of the rectangle, for one that moves (an elevator door
   * sliding into the wall). It has to stay inside its `area`.
   */
  setSize(length: number, width: number) {
    this.setCuts(length, width);
    const mesh = this.ownMesh;
    if (mesh) {
      const geometry = mesh.geometry;
      this.writeMesh(
        0,
        geometry.positions,
        geometry.uvs,
        geometry.indices as Uint32Array,
        [0, 0, 0],
      );
      geometry.getBuffer("aPosition").update();
    }
  }

  /** Whether it moves with a body, and has its own mesh */
  get moves(): boolean {
    return this.follow !== undefined && this.follow.motion !== "static";
  }

  /** Where its middle is in the world, and which way it points */
  private getPose(): [number, number, number] {
    const body = this.follow;
    if (body) {
      const [x, y] = body.toWorldFrame(this.position);
      return [x, y, body.angle + this.angle];
    }
    return [this.position.x, this.position.y, this.angle];
  }

  /**
   * Writes its vertices (world positions and texture coordinates) and
   * indices into a mesh's arrays, starting at its `index`th shadow
   */
  writeMesh(
    index: number,
    positions: Float32Array,
    uvs: Float32Array,
    indices: Uint32Array,
    [x, y, angle]: [number, number, number] = this.getPose(),
  ) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const first = index * CONTACT_SHADOW_VERTICES;
    for (let j = 0; j < 4; j++) {
      const across = this.cutsAcross[j];
      for (let i = 0; i < 4; i++) {
        const along = this.cutsAlong[i];
        const v = (first + j * 4 + i) * 2;
        positions[v] = x + along * cos - across * sin;
        positions[v + 1] = y + along * sin + across * cos;
        uvs[v] = UV_CUTS[i];
        uvs[v + 1] = UV_CUTS[j];
      }
    }
    let k = index * CONTACT_SHADOW_INDICES;
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        const corner = first + j * 4 + i;
        indices[k++] = corner;
        indices[k++] = corner + 1;
        indices[k++] = corner + 4;
        indices[k++] = corner + 1;
        indices[k++] = corner + 5;
        indices[k++] = corner + 4;
      }
    }
  }

  /** Its own mesh, around its middle, for one that moves */
  get mesh(): Mesh {
    if (!this.ownMesh) {
      const positions = new Float32Array(CONTACT_SHADOW_VERTICES * 2);
      const uvs = new Float32Array(CONTACT_SHADOW_VERTICES * 2);
      const indices = new Uint32Array(CONTACT_SHADOW_INDICES);
      this.writeMesh(0, positions, uvs, indices, [0, 0, 0]);
      this.ownMesh = new Mesh({
        geometry: new MeshGeometry({ positions, uvs, indices }),
        texture: getContactShadowTexture(),
      });
      this.ownMesh.blendMode = "min";
    }
    return this.ownMesh;
  }

  /** Moves its own mesh to where it is */
  place() {
    const [x, y, angle] = this.getPose();
    this.mesh.position.set(x, y);
    this.mesh.rotation = angle;
  }

  /**
   * Around everywhere it can darken: where it is, or for one that moves, the
   * `area` it was given, or else everywhere it can get to, swinging around
   * its body like a door. (Something that wanders, like furniture that gets
   * pushed, would need its area worked out as it goes.)
   */
  getArea(): [number, number, number, number] {
    if (this.area) {
      return this.area;
    }
    const body = this.follow;
    if (body && this.moves) {
      const reach = this.position.magnitude + this.radius;
      const [x, y] = body.position;
      return [x - reach, y - reach, x + reach, y + reach];
    }
    const [x, y, angle] = this.getPose();
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const halfLength = this.cutsAlong[3];
    const halfWidth = this.cutsAcross[3];
    const halfX = halfLength * cos + halfWidth * sin;
    const halfY = halfLength * sin + halfWidth * cos;
    return [x - halfX, y - halfY, x + halfX, y + halfY];
  }

  @on("add")
  onAdd() {
    this.manager = this.game.entities.getSingleton(ContactShadows);
    this.manager.addShadow(this);
  }

  @on("destroy")
  onDestroy() {
    this.manager!.removeShadow(this);
    this.manager = undefined;
    this.ownMesh?.destroy({ children: true });
  }
}

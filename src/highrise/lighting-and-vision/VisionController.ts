import {
  Container,
  Graphics,
  Mesh,
  MeshGeometry,
  Sprite,
  Texture,
} from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { profiler } from "../../core/util/Profiler";
import { V, V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";
import { getOccluders } from "./occluders";
import {
  computeVisibility,
  visibilityAt,
  visibilityOutline,
  VisibilitySample,
} from "./visibility";
import { buildVisionMesh } from "./visionMesh";

export const MAX_VISION = 10; // meters
/** Where the vision mesh hands over to the static darkness beyond it */
const OUTER_RADIUS = MAX_VISION + 1;
/** Radius of the "eye", in meters: how soft the edges of shadows are */
const VISION_SOURCE_RADIUS = 0.2;
/** Softness of edges that aren't shadows (walls, the range limit), in meters */
const EDGE_ANTIALIAS_WIDTH = 0.05;
const MAX_PENUMBRA_WIDTH = 3;

/**
 * Hides what the player can't see. The visible region is computed
 * additively as a polygon (see `visibility.ts`) and everything outside it is
 * covered by a mesh with soft edges (see `visionMesh.ts`), so there is no
 * render texture and no blur filter, and the polygon is available to anyone
 * who wants to know whether a point is visible.
 */
export default class VisionController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  sprite: Container & GameSprite;
  private geometry = new MeshGeometry({
    positions: new Float32Array(0),
    uvs: new Float32Array(0),
    indices: new Uint32Array(0),
  });
  private mesh: Mesh;

  /** Where the player is looking from */
  private eye: V2d = V(0, 0);
  /** What can be seen from there, sorted by angle */
  private samples: VisibilitySample[] = [];

  private _enabled = true;
  /** When disabled, everything is visible (for cheats and benchmarks). */
  get enabled() {
    return this._enabled;
  }
  set enabled(value: boolean) {
    this._enabled = value;
    this.sprite.visible = value;
  }

  constructor(private getPlayer: () => Human | undefined) {
    super();

    this.mesh = new Mesh({
      geometry: this.geometry,
      texture: getEdgeTexture(),
    });
    this.mesh.tint = 0x000000;

    const fog = Sprite.from("visionFog");
    fog.blendMode = "multiply";
    fog.width = MAX_VISION * 2;
    fog.height = MAX_VISION * 2;
    fog.anchor.set(0.5);

    // The mesh's outer edge is a polygon just inside this circle, so the
    // hole is a bit smaller than the mesh to leave no slivers between them
    const distanceShadows = new Graphics();
    distanceShadows
      .rect(-100, -100, 200, 200)
      .fill(0x000000)
      .circle(0, 0, OUTER_RADIUS - 0.1)
      .cut();

    this.sprite = new Container();
    this.sprite.addChild(this.mesh, fog, distanceShadows);
    this.sprite.layerName = Layer.VISION;
  }

  /** How visible a point is to the player: 1 in plain view, 0 hidden */
  visibilityOf(point: V2d): number {
    if (!this.enabled) {
      return 1;
    }
    return visibilityAt(this.eye, this.samples, point);
  }

  @on("render")
  onRender() {
    if (!this.enabled) {
      return;
    }
    const player = this.getPlayer();
    if (!player) {
      return;
    }
    this.eye = player.getPosition();
    this.sprite.position.copyFrom(this.eye);

    // Doors can move without the player moving, so always recompute
    const occluders = profiler.measure("VisionController.occluders", () =>
      getOccluders(this.game, this.eye, MAX_VISION, true),
    );
    this.samples = profiler.measure("VisionController.visibility", () =>
      computeVisibility(this.eye, MAX_VISION, occluders),
    );
    profiler.measure("VisionController.mesh", () => {
      const outline = visibilityOutline(this.eye, this.samples);
      const { positions, uvs, indices } = buildVisionMesh(this.eye, outline, {
        outerRadius: OUTER_RADIUS,
        antialiasWidth: EDGE_ANTIALIAS_WIDTH,
        sourceRadius: VISION_SOURCE_RADIUS,
        maxPenumbraWidth: MAX_PENUMBRA_WIDTH,
      });
      this.mesh.visible = indices.length > 0;
      // Set uvs first: the geometry expects them to be at least as long as positions
      this.geometry.uvs = uvs;
      this.geometry.positions = positions;
      this.geometry.indices = indices;
    });
  }

  @on("destroy")
  onDestroy() {
    this.geometry.destroy();
  }
}

const EDGE_TEXTURE_SIZE = 64;
let edgeTexture: Texture | undefined;

/** A vertical alpha ramp: clear at v = 0, opaque at v = 1, smooth in between */
function getEdgeTexture(): Texture {
  if (!edgeTexture) {
    const size = EDGE_TEXTURE_SIZE;
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(2, size);
    for (let y = 0; y < size; y++) {
      const t = (y + 0.5) / size;
      const alpha = t * t * (3 - 2 * t);
      for (let x = 0; x < 2; x++) {
        const i = (y * 2 + x) * 4;
        image.data[i] = 255;
        image.data[i + 1] = 255;
        image.data[i + 2] = 255;
        image.data[i + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(image, 0, 0);
    edgeTexture = Texture.from(canvas);
    edgeTexture.source.addressMode = "clamp-to-edge";
    edgeTexture.source.scaleMode = "linear";
  }
  return edgeTexture;
}

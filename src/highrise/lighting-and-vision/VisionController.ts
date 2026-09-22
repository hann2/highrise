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
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { profiler } from "../../core/util/Profiler";
import { V, V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";
import { Level } from "../levels/Level";
import { ExploredMap } from "./ExploredMap";
import { getOccluders } from "./occluders";
import { getPenumbraTexture } from "./penumbraTexture";
import {
  computeVisibility,
  visibilityAt,
  visibilityOutline,
  VisibilitySample,
} from "./visibility";
import { buildPenumbraMesh, buildVisionMesh, MeshData } from "./visionMesh";

export const MAX_VISION = 10; // meters
/** Where the vision mesh hands over to the static darkness beyond it */
const OUTER_RADIUS = MAX_VISION + 1;
/** Radius of the "eye", in meters: how soft the edges of shadows are */
const VISION_SOURCE_RADIUS = 0.2;
/** Softness of edges that aren't shadows (walls, the range limit), in meters */
const EDGE_ANTIALIAS_WIDTH = 0.05;
/** Penumbra wedges reach this far from their corner, past everything visible */
const PENUMBRA_LENGTH = OUTER_RADIUS * 2;
/** How dark explored places are when the player can't currently see them */
const EXPLORED_DARKNESS = 0.6;
/** Pixels per meter of the darkness texture. The screen is about 65 px/m at the default zoom. */
const DARKNESS_RESOLUTION = 48;

/**
 * Fog of war. What the player has never seen is black; what they have seen
 * but can't see right now is dimmed; what they can see is clear.
 *
 * The visible region is computed additively as a polygon (see
 * `visibility.ts`), and meshes with soft edges (see `visionMesh.ts`) cover
 * everything outside it. They are rendered at full strength into a texture
 * centered on the player, which is drawn over the world at the dim
 * strength (drawing the meshes dimmed directly would show their overlaps),
 * and an `ExploredMap` remembers where the visible region has been and
 * draws the black on top. The polygon is available to anyone who wants to
 * know whether a point is visible; enemies hide themselves with it.
 */
export default class VisionController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  sprite: Container & GameSprite;
  private geometry = emptyGeometry();
  private penumbraGeometry = emptyGeometry();
  private mesh: Mesh;
  private penumbraMesh: Mesh;
  /** The meshes, rendered into `darkness` each frame */
  private darknessContainer = new Container();
  private darkness: RenderTexture;
  private darknessSprite: Sprite;
  private explored?: ExploredMap;

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
    this.penumbraMesh = new Mesh({
      geometry: this.penumbraGeometry,
      texture: getPenumbraTexture(),
    });
    this.penumbraMesh.tint = 0x000000;
    this.darknessContainer.addChild(this.mesh, this.penumbraMesh);
    // No multisampling: every visible edge in it is a gradient already
    this.darkness = RenderTexture.create({
      width: OUTER_RADIUS * 2,
      height: OUTER_RADIUS * 2,
      resolution: DARKNESS_RESOLUTION,
    });
    this.darknessSprite = new Sprite(this.darkness);
    this.darknessSprite.anchor.set(0.5);
    this.darknessSprite.alpha = EXPLORED_DARKNESS;

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
    distanceShadows.alpha = EXPLORED_DARKNESS;

    this.sprite = new Container();
    this.sprite.addChild(this.darknessSprite, distanceShadows, fog);
    this.sprite.layerName = Layer.VISION;
  }

  /** How visible a point is to the player: 1 in plain view, 0 hidden */
  visibilityOf(point: V2d): number {
    if (!this.enabled) {
      return 1;
    }
    return visibilityAt(this.eye, this.samples, point);
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    this.explored = new ExploredMap(
      game.renderer.app.renderer,
      MAX_VISION,
      this.darkness,
    );
    this.sprite.addChild(this.explored.sprite);
  }

  @on("startLevel")
  onStartLevel({ level }: { level: Level }) {
    this.explored?.reset(level.width, level.height);
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
    if (this.explored) {
      // The map is in world coordinates, this container follows the eye
      const [ox, oy] = this.explored.origin;
      this.explored.sprite.position.set(ox - this.eye[0], oy - this.eye[1]);
    }

    // Doors can move without the player moving, so always recompute
    const occluders = profiler.measure("VisionController.occluders", () =>
      getOccluders(this.game, this.eye, MAX_VISION, true),
    );
    this.samples = profiler.measure("VisionController.visibility", () =>
      computeVisibility(this.eye, MAX_VISION, occluders, {
        sourceRadius: VISION_SOURCE_RADIUS,
      }),
    );
    profiler.measure("VisionController.mesh", () => {
      const outline = visibilityOutline(this.eye, this.samples);
      setGeometry(
        this.geometry,
        buildVisionMesh(this.eye, outline, {
          outerRadius: OUTER_RADIUS,
          antialiasWidth: EDGE_ANTIALIAS_WIDTH,
        }),
      );
      setGeometry(
        this.penumbraGeometry,
        buildPenumbraMesh(this.eye, outline.silhouettes, PENUMBRA_LENGTH),
      );
      this.mesh.visible = this.geometry.indices.length > 0;
      this.penumbraMesh.visible = this.penumbraGeometry.indices.length > 0;
    });
    profiler.measure("VisionController.darkness", () => {
      // The meshes are relative to the eye, so put it in the middle
      this.game.renderer.app.renderer.render({
        container: this.darknessContainer,
        target: this.darkness,
        clear: true,
        clearColor: [0, 0, 0, 0],
        transform: new Matrix().translate(OUTER_RADIUS, OUTER_RADIUS),
      });
    });
    profiler.measure("VisionController.explored", () => {
      this.explored?.update(this.eye);
    });
  }

  @on("destroy")
  onDestroy() {
    this.explored?.destroy();
    this.darknessContainer.destroy({ children: true });
    this.darkness.destroy(true);
    this.geometry.destroy();
    this.penumbraGeometry.destroy();
  }
}

function emptyGeometry(): MeshGeometry {
  return new MeshGeometry({
    positions: new Float32Array(0),
    uvs: new Float32Array(0),
    indices: new Uint32Array(0),
  });
}

function setGeometry(
  geometry: MeshGeometry,
  { positions, uvs, indices }: MeshData,
) {
  // Set uvs first: the geometry expects them to be at least as long as positions
  geometry.uvs = uvs;
  geometry.positions = positions;
  geometry.indices = indices;
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

import { Container, RenderTexture, Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import type Game from "../../core/Game";
import { ImageName } from "../../../resources/resources";
import { Persistence } from "../constants/constants";
import { cellKey, Spill, SpillGrid } from "./SpillGrid";

/** Meters across each texture footprints are painted into */
const CHUNK_SIZE = 8;
/** Pixels per meter of the painted footprints */
const PAINT_RESOLUTION = 128;
/** What blood is tinted, on the floor and on shoes */
export const BLOOD_COLOR = 0x8a0a0a;

/** A print to paint (see `stamp`) */
export interface Stamp {
  image: ImageName;
  position: [number, number];
  angle: number;
  length: number;
  width: number;
  /** Mirrored across its length: a left shoe's print from a right one's */
  mirror: boolean;
  color: number;
  alpha: number;
}

interface Chunk {
  texture: RenderTexture;
  sprite: Sprite;
  /** Stamps waiting to be painted in at the next render */
  pending: Stamp[];
}

/**
 * What's spilled on the floor, for shoes to pick up (`spillAt`), and what
 * they leave on it (`stamp`): footprints, painted into textures in squares of
 * `CHUNK_SIZE` meters made where they're needed, so they stay for the floor
 * and cost nothing to draw however many there are. Spills are kept in a
 * `SpillGrid`, only where something has been spilled, so it doesn't need to
 * know how big the level is.
 *
 * One per floor (it's cleared with the floor), made by `getFloorStains` the
 * first time anything spills, so every scene has one without setting it up.
 * Spills don't draw themselves: the blood splats and pools do that, and tell
 * this where they are (`spill`).
 */
export default class FloorStains extends BaseEntity implements Entity {
  id = "floorStains";
  persistenceLevel = Persistence.Floor;
  sprite: Container & GameSprite;
  private spills = new SpillGrid();
  private chunks = new Map<number, Chunk>();
  /** The sprites stamps are painted with, one each, kept for next time */
  private brushes: Sprite[] = [];
  private brushContainer = new Container();

  constructor() {
    super();
    this.sprite = new Container() as Container & GameSprite;
    this.sprite.layerName = Layer.FLOOR_DECALS;
  }

  /**
   * Spills `amount` of something on the floor in a circle: the cells whose
   * middles are inside it. Where there's already some, the most of each is kept.
   */
  spill(
    position: [number, number],
    radius: number,
    color: number,
    amount = 1,
    lifetime = Infinity,
  ) {
    const now = this.game.simulatedTime;
    this.spills.spill(position, radius, color, amount, now + lifetime, now);
  }

  /** What's spilled at a point, if anything */
  spillAt(position: [number, number]): Spill | undefined {
    return this.spills.spillAt(position, this.game.simulatedTime);
  }

  /** Paints a print on the floor, at the next render; it stays for the floor */
  stamp(stamp: Stamp) {
    const column = Math.floor(stamp.position[0] / CHUNK_SIZE);
    const row = Math.floor(stamp.position[1] / CHUNK_SIZE);
    // A print near a chunk's edge goes in its neighbors too, so it isn't cut off
    const reach = Math.max(stamp.length, stamp.width) / 2;
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        const left = (column + dx) * CHUNK_SIZE;
        const top = (row + dy) * CHUNK_SIZE;
        const [x, y] = stamp.position;
        if (
          x + reach > left &&
          x - reach < left + CHUNK_SIZE &&
          y + reach > top &&
          y - reach < top + CHUNK_SIZE
        ) {
          this.chunk(column + dx, row + dy).pending.push(stamp);
        }
      }
    }
  }

  private chunk(column: number, row: number): Chunk {
    const key = cellKey(column, row);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      const texture = RenderTexture.create({
        width: CHUNK_SIZE,
        height: CHUNK_SIZE,
        resolution: PAINT_RESOLUTION,
      });
      const sprite = new Sprite(texture);
      sprite.position.set(column * CHUNK_SIZE, row * CHUNK_SIZE);
      this.sprite.addChild(sprite);
      chunk = { texture, sprite, pending: [] };
      this.chunks.set(key, chunk);
      // Cleared before anything's painted in
      this.game.renderer.app.renderer.render({
        container: new Container(),
        target: texture,
        clear: true,
        clearColor: [0, 0, 0, 0],
      });
    }
    return chunk;
  }

  /** Paints the stamps waiting for each chunk, all at once */
  @on("render")
  onRender() {
    for (const chunk of this.chunks.values()) {
      const count = chunk.pending.length;
      if (count === 0) {
        continue;
      }
      const { x, y } = chunk.sprite.position;
      chunk.pending.forEach((stamp, i) => {
        const brush = this.brush(i);
        brush.texture = Sprite.from(stamp.image).texture;
        brush.position.set(stamp.position[0] - x, stamp.position[1] - y);
        brush.rotation = stamp.angle;
        brush.width = stamp.length;
        brush.height = stamp.width;
        if (stamp.mirror) {
          brush.scale.y *= -1;
        }
        brush.tint = stamp.color;
        brush.alpha = stamp.alpha;
        brush.visible = true;
      });
      for (let i = count; i < this.brushes.length; i++) {
        this.brushes[i].visible = false;
      }
      this.game.renderer.app.renderer.render({
        container: this.brushContainer,
        target: chunk.texture,
        clear: false,
      });
      chunk.pending = [];
    }
  }

  private brush(index: number): Sprite {
    let brush = this.brushes[index];
    if (!brush) {
      brush = new Sprite();
      brush.anchor.set(0.5);
      this.brushes.push(brush);
      this.brushContainer.addChild(brush);
    }
    return brush;
  }

  @on("destroy")
  onDestroy() {
    for (const chunk of this.chunks.values()) {
      chunk.texture.destroy(true);
    }
    this.brushContainer.destroy({ children: true });
  }
}

/** The floor's stains, made the first time they're needed on a floor */
export function getFloorStains(game: Game): FloorStains {
  return (
    (game.entities.getById("floorStains") as FloorStains | undefined) ??
    game.addEntity(new FloorStains())
  );
}

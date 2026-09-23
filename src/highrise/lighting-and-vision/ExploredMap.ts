import {
  Container,
  Graphics,
  Matrix,
  Renderer,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js";
import { V2d } from "../../core/Vector";

/** Pixels per meter of the explored map */
const RESOLUTION = 32;
/** Biggest texture we'll make; larger levels get a coarser map */
const MAX_TEXTURE_SIZE = 2048;
/** How far past the level's edges the map extends, in meters */
const MARGIN = 2;

/**
 * Remembers where the player has been able to see, as a texture covering
 * the level: opaque black to start with, and cleared wherever the visible
 * region has ever been. Drawn over the world, it hides what the player
 * hasn't explored.
 *
 * Each frame the visible region (a disc with the current darkness erased
 * from it) is rendered into a small texture, and that is erased from the
 * map. Erasing only ever clears, so the soft edges of the region stay
 * soft for a frame or two and then settle wherever any light reached.
 */
export class ExploredMap {
  /** The darkness of unexplored space, positioned by whoever draws it */
  readonly sprite: Sprite;
  private texture: RenderTexture;
  private resolution = RESOLUTION;

  private visibleTexture: RenderTexture;
  private visibleContainer = new Container();
  /** The visible region, erased from the map. (Wrapped: a render call's root container's blend mode is ignored.) */
  private stampContainer = new Container();
  private stamp: Sprite;
  private disc: Graphics;
  private darknessSprite: Sprite;

  /**
   * @param darkness what the player can't see right now, centered on the
   *   eye, with alpha 1 where nothing can be seen
   */
  constructor(
    private renderer: Renderer,
    private radius: number,
    darkness: Texture,
  ) {
    // The visible region: everything within range that isn't dark
    this.disc = new Graphics().circle(0, 0, radius).fill(0xffffff);
    this.darknessSprite = new Sprite(darkness);
    this.darknessSprite.anchor.set(0.5);
    this.darknessSprite.blendMode = "erase";
    this.visibleContainer.addChild(this.disc, this.darknessSprite);
    this.visibleTexture = makeVisibleTexture(radius);
    this.stamp = new Sprite(this.visibleTexture);
    this.stamp.anchor.set(0.5);
    this.stamp.blendMode = "erase";
    this.stampContainer.addChild(this.stamp);

    this.texture = RenderTexture.create({ width: 1, height: 1 });
    this.sprite = new Sprite(this.texture);
  }

  /**
   * Changes how far the player can see, keeping what has been explored.
   * `darkness` is the replacement for the texture passed to the constructor.
   */
  setRadius(radius: number, darkness: Texture) {
    this.radius = radius;
    this.disc.clear().circle(0, 0, radius).fill(0xffffff);
    this.darknessSprite.texture = darkness;
    // Fresh rather than resized, see `reset`
    this.visibleTexture.destroy(true);
    this.visibleTexture = makeVisibleTexture(radius);
    this.stamp.texture = this.visibleTexture;
  }

  /** Where the top-left corner of the map is, in world coordinates */
  get origin(): [number, number] {
    return [-MARGIN, -MARGIN];
  }

  /**
   * Fits the map to a level of the given size in meters. Forgets everything,
   * unless `from` is a map saved earlier with `toImage` for the same size, in
   * which case that is remembered instead.
   */
  reset(levelWidth: number, levelHeight: number, from?: Texture) {
    const width = levelWidth + 2 * MARGIN;
    const height = levelHeight + 2 * MARGIN;
    this.resolution = Math.min(
      RESOLUTION,
      Math.floor(MAX_TEXTURE_SIZE / Math.max(width, height)),
    );
    // A fresh texture rather than a resize, which leaves the sprite's
    // texture coordinates behind
    this.texture.destroy(true);
    this.texture = RenderTexture.create({
      width,
      height,
      resolution: this.resolution,
    });
    this.sprite.texture = this.texture;
    if (from) {
      const saved = new Sprite(from);
      saved.width = width;
      saved.height = height;
      this.renderer.render({
        container: saved,
        target: this.texture,
        clear: true,
        clearColor: [0, 0, 0, 0],
      });
      saved.destroy();
    } else {
      this.renderer.render({
        container: new Container(),
        target: this.texture,
        clear: true,
        clearColor: [0, 0, 0, 1],
      });
    }
  }

  /** The map as a PNG data URL, to keep for `reset` later */
  toImage(): Promise<string> {
    return this.renderer.extract.base64({
      target: this.texture,
      format: "png",
    });
  }

  /** Marks what can currently be seen from `eye` as explored */
  update(eye: V2d) {
    // The darkness is centered on the eye, so put that in the middle
    this.renderer.render({
      container: this.visibleContainer,
      target: this.visibleTexture,
      clear: true,
      clearColor: [0, 0, 0, 0],
      transform: new Matrix().translate(this.radius, this.radius),
    });
    this.stamp.position.set(eye[0] + MARGIN, eye[1] + MARGIN);
    this.renderer.render({
      container: this.stampContainer,
      target: this.texture,
      clear: false,
    });
  }

  destroy() {
    this.visibleContainer.destroy({ children: true });
    this.stampContainer.destroy({ children: true });
    this.visibleTexture.destroy(true);
    if (!this.sprite.destroyed) {
      this.sprite.destroy();
    }
    this.texture.destroy(true);
  }
}

function makeVisibleTexture(radius: number): RenderTexture {
  return RenderTexture.create({
    width: radius * 2,
    height: radius * 2,
    resolution: RESOLUTION,
    antialias: true,
  });
}

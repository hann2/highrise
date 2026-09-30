import { Matrix, Point } from "pixi.js";
import { on } from "../entity/handler";
import { V, V2d } from "../Vector";
import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import { lerpOrSnap } from "../util/MathUtil";
import { GameRenderer2d } from "./GameRenderer2d";
import { LayerInfo } from "./LayerInfo";

/** Controls the viewport.
 * TODO: Document camera better
 */
export class Camera2d extends BaseEntity implements Entity {
  tags = ["camera"];
  persistenceLevel = 100;
  tickLayer = "camera" as const;

  renderer: GameRenderer2d;
  position: V2d;
  z: number;
  angle: number;
  velocity: V2d;
  /**
   * Added to the position when drawing, in world units, for screen shake.
   * Kept apart from `position` so whatever moves the camera doesn't fight it.
   */
  shakeOffset: V2d = V(0, 0);

  paralaxScale = 0.1;

  constructor(
    renderer: GameRenderer2d,
    position: V2d = V([0, 0]),
    z = 25.0,
    angle = 0,
  ) {
    super();
    this.renderer = renderer;
    this.position = position;
    this.z = z;
    this.angle = angle;
    this.velocity = V([0, 0]);
  }

  get x() {
    return this.position[0];
  }

  set x(value) {
    this.position[0] = value;
  }

  get y() {
    return this.position[1];
  }

  set y(value) {
    this.position[1] = value;
  }

  get vx() {
    return this.velocity[0];
  }

  set vx(value) {
    this.velocity[0] = value;
  }

  get vy() {
    return this.velocity[1];
  }

  set vy(value) {
    this.velocity[1] = value;
  }

  getPosition() {
    return this.position;
  }

  @on("tick")
  onTick(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /** Center the camera on a position */
  center([x, y]: V2d) {
    this.x = x;
    this.y = y;
  }

  /**
   * Move the camera toward being centered on a (possibly moving) target.
   * The camera matches the target's velocity and closes the remaining distance
   * exponentially, at `stiffness` per second. Call this from `onTick`.
   */
  smoothCenter(
    [x, y]: V2d,
    [vx, vy]: V2d = V([0, 0]),
    stiffness: number = 4.0,
  ) {
    // Closing more than the whole gap in one tick would overshoot
    const k = Math.min(stiffness, this.game.ticksPerSecond);
    this.vx = vx + k * (x - this.x);
    this.vy = vy + k * (y - this.y);
  }

  /**
   * Move the velocity part of the way to `[vx, vy]`. `stiffness` is the part
   * of the way it goes per 60th of a second, whatever the tick rate. Call
   * this from `onTick`.
   */
  smoothSetVelocity([vx, vy]: V2d, stiffness: number = 0.9) {
    const moved = 1 - perTick(1 - stiffness, this.game.tickDuration);
    this.vx = lerpOrSnap(this.vx, vx, moved, 0.001);
    this.vy = lerpOrSnap(this.vy, vy, moved, 0.001);
  }

  /** Move the camera part of the way to the desired zoom; `smooth` is the part of the way it doesn't go per 60th of a second. */
  smoothZoom(z: number, smooth: number = 0.9) {
    const kept = perTick(smooth, this.game.tickDuration);
    this.z = kept * this.z + (1 - kept) * z;
  }

  /** Returns [width, height] of the viewport in pixels */
  getViewportSize(): V2d {
    return V(
      this.renderer.canvas.width / this.renderer.app.renderer.resolution,
      this.renderer.canvas.height / this.renderer.app.renderer.resolution,
    );
  }

  /**
   * Calculates the world coordinate bounds of the current camera viewport.
   * Useful for culling, bounds checking, and viewport-relative positioning.
   */
  getWorldViewport(): {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  } {
    const [left, top] = this.toWorld(V(0, 0));
    const [right, bottom] = this.toWorld(this.getViewportSize());
    const width = right - left;
    const height = bottom - top;
    return { top, bottom, left, right, width, height };
  }

  /** The view's bounding box in the world, and what it was worked out from */
  private viewBounds = {
    key: [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN],
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };

  /**
   * Whether a circle of `radius` around `[x, y]` might be in view (it's
   * checked against the view's bounding box in the world, which is bigger
   * than the view when the camera is rotated). Cheap enough to call for
   * every sprite every frame: the bounding box is only worked out again when
   * the camera or the screen changes.
   */
  isInView([x, y]: [number, number], radius: number = 0): boolean {
    const bounds = this.getViewBounds();
    return (
      x + radius >= bounds.left &&
      x - radius <= bounds.right &&
      y + radius >= bounds.top &&
      y - radius <= bounds.bottom
    );
  }

  private getViewBounds() {
    const bounds = this.viewBounds;
    const key = bounds.key;
    const canvas = this.renderer.canvas;
    if (
      key[0] === this.x &&
      key[1] === this.y &&
      key[2] === this.z &&
      key[3] === this.angle &&
      key[4] === this.shakeOffset.x &&
      key[5] === this.shakeOffset.y &&
      key[6] === canvas.width &&
      key[7] === canvas.height
    ) {
      return bounds;
    }
    key[0] = this.x;
    key[1] = this.y;
    key[2] = this.z;
    key[3] = this.angle;
    key[4] = this.shakeOffset.x;
    key[5] = this.shakeOffset.y;
    key[6] = canvas.width;
    key[7] = canvas.height;
    const [w, h] = this.getViewportSize();
    const corners = [V(0, 0), V(w, 0), V(0, h), V(w, h)].map((corner) =>
      this.toWorld(corner),
    );
    bounds.left = Math.min(...corners.map(([x]) => x));
    bounds.right = Math.max(...corners.map(([x]) => x));
    bounds.top = Math.min(...corners.map(([, y]) => y));
    bounds.bottom = Math.max(...corners.map(([, y]) => y));
    return bounds;
  }

  /** Convert screen coordinates to world coordinates */
  toWorld([x, y]: V2d, parallax = V(1.0, 1.0)): V2d {
    let p = new Point(x, y);
    p = this.getMatrix(parallax).applyInverse(p, p);
    return V(p.x, p.y);
  }

  /** Convert world coordinates to screen coordinates */
  toScreen([x, y]: V2d, parallax = V(1.0, 1.0)): V2d {
    let p = new Point(x, y);
    p = this.getMatrix(parallax).apply(p, p);
    return V(p.x, p.y);
  }

  /** Creates a transformation matrix to go from screen world space to screen space. */
  getMatrix(
    [px, py]: [number, number] = [1, 1],
    [ax, ay]: V2d = V(0, 0),
  ): Matrix {
    const [w, h] = this.getViewportSize();
    const { z, angle } = this;
    const cx = this.x + this.shakeOffset.x;
    const cy = this.y + this.shakeOffset.y;

    return (
      new Matrix()
        // align the anchor with the camera
        .translate(ax * px, ay * py)
        .translate(-cx * px, -cy * py)
        // do all the scaling and rotating
        .scale(z * px, z * py)
        .rotate(angle)
        // put it back
        .translate(-ax * z, -ay * z)
        .scale(1 / px, 1 / py)
        // Put it on the center of the screen
        .translate(w / 2.0, h / 2.0)
    );
  }

  /** Update the properties of a renderer layer to match this camera */
  updateLayer(layer: LayerInfo) {
    const container = layer.container;
    if (!layer.paralax.equals([0, 0])) {
      const matrix = this.getMatrix(layer.paralax, layer.anchor);
      container.updateTransform({
        x: matrix.tx,
        y: matrix.ty,
        scaleX: matrix.a,
        scaleY: matrix.d,
        skewX: matrix.b,
        skewY: matrix.c,
      });
    }
  }
}

/** A fraction kept per 60th of a second, as the fraction kept per tick of `tickDuration` */
function perTick(keptPer60th: number, tickDuration: number): number {
  return Math.pow(keptPer60th, 60 * tickDuration);
}

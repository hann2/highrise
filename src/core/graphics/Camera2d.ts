import { Matrix, Point } from "pixi.js";
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

  renderer: GameRenderer2d;
  position: V2d;
  z: number;
  angle: number;
  velocity: V2d;

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

  onTick(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /** Center the camera on a position */
  center([x, y]: V2d) {
    this.x = x;
    this.y = y;
  }

  /** Move the camera toward being centered on a position, with a target velocity */
  smoothCenter(
    [x, y]: V2d,
    [vx, vy]: V2d = V([0, 0]),
    stiffness: number = 1.0,
    damping: number = 1.0,
  ) {
    const dx = x - this.x;
    const dy = y - this.y;

    const dt = this.game!.averageDt;

    this.vx += (stiffness * dx - damping * (this.vx - vx)) * dt;
    this.vy += (stiffness * dy - damping * (this.vy - vy)) * dt;
  }

  smoothSetVelocity([vx, vy]: V2d, stiffness: number = 0.9) {
    this.vx = lerpOrSnap(this.vx, vx, stiffness, 0.001);
    this.vy = lerpOrSnap(this.vy, vy, stiffness, 0.001);
  }

  /** Move the camera part of the way to the desired zoom. */
  smoothZoom(z: number, smooth: number = 0.9) {
    this.z = smooth * this.z + (1 - smooth) * z;
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
    const [top, left] = this.toWorld(V(0, 0));
    const [bottom, right] = this.toWorld(this.getViewportSize());
    const width = right - left;
    const height = bottom - top;
    return { top, bottom, left, right, width, height };
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
    const { x: cx, y: cy, z, angle } = this;

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

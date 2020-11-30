import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import Game from "../Game";
import { Shape, Box, Capsule, Circle, Convex, vec2 } from "p2";
import { KeyCode } from "../io/Keys";

export default class DebugRenderer extends BaseEntity implements Entity {
  pausable = false;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  enabled = false;
  aabbsEnabled = false;

  constructor() {
    super();
    this.canvas = document.createElement("canvas");
    this.canvas.width = window.innerWidth * (devicePixelRatio ?? 1);
    this.canvas.height = window.innerHeight * (devicePixelRatio ?? 1);
    this.ctx = this.canvas.getContext("2d")!;
    if (!this.ctx) {
      throw new Error("CTX is null");
    }
  }

  async onAdd(game: Game) {
    document.body.appendChild(this.canvas);
  }

  onDestroy() {
    document.body.removeChild(this.canvas);
  }

  onKeyDown(key: KeyCode) {
    if (key === "Escape") {
      this.enabled = !this.enabled;
      this.canvas.style.display = this.enabled ? "" : "none";
    }
  }

  onRender() {
    if (this.enabled) {
      const scale = 12;
      const offset: v2 = [25 * scale, 20];

      const ctx = this.ctx;

      ctx.fillStyle = "#fff";
      ctx.clearRect(0, 0, 55 * scale, this.canvas.height);
      // ctx.fillRect(0, 0, 55 * scale, this.canvas.height);
      ctx.fillStyle = "none";

      for (const body of this.game!.world.bodies) {
        if (this.aabbsEnabled) {
          const { lowerBound, upperBound } = body.getAABB();

          const width = upperBound[0] - lowerBound[0];
          const height = upperBound[1] - lowerBound[1];

          ctx.strokeStyle = "#0003";
          ctx.strokeRect(
            lowerBound[0] * scale + offset[0],
            lowerBound[1] * scale + offset[1],
            width * scale,
            height * scale
          );
        }

        for (const shape of body.shapes) {
          ctx.lineWidth = 1;
          if (!shape.collisionResponse || !body.collisionResponse) {
            ctx.fillStyle = "#00fa";
          } else {
            ctx.fillStyle = "#000";
          }

          if (isCircle(shape)) {
            const center: v2 = [0, 0];
            body.toWorldFrame(center, shape.position);
            ctx.beginPath();
            ctx.arc(
              center[0] * scale + offset[0],
              center[1] * scale + offset[1],
              shape.radius * scale,
              0,
              Math.PI * 2,
              true
            ); // Outer circle
            ctx.fill();
          } else if (isConvex(shape)) {
            const vrot = vec2.create();
            const verts: v2[] = shape.vertices.map((v) => {
              vec2.rotate(vrot, v, shape.angle);
              return [vrot[0] + shape.position[0], vrot[1] + shape.position[1]];
            });

            const point = vec2.create();
            ctx.beginPath();
            body.toWorldFrame(point, verts[0]);
            ctx.moveTo(
              point[0] * scale + offset[0],
              point[1] * scale + offset[1]
            );
            for (let i = 1; i < shape.vertices.length; i++) {
              body.toWorldFrame(point, verts[i]);
              ctx.lineTo(
                point[0] * scale + offset[0],
                point[1] * scale + offset[1]
              );
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#aaa";
            ctx.stroke();
          } else if (isCapsule(shape)) {
            const start: v2 = [-shape.length / 2, 0];
            const end: v2 = [shape.length / 2, 0];

            vec2.rotate(start, start, shape.angle);
            vec2.rotate(end, end, shape.angle);

            vec2.add(start, start, shape.position);
            vec2.add(end, end, shape.position);

            body.toWorldFrame(start, start);
            body.toWorldFrame(end, end);

            vec2.scale(start, start, scale);
            vec2.scale(end, end, scale);

            vec2.add(start, start, offset);
            vec2.add(end, end, offset);

            ctx.strokeStyle = "#000";
            ctx.lineWidth = shape.radius * scale;
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.stroke();
          }
        }
      }
    }
  }
}

type v2 = [number, number];

function isBox(shape: Shape): shape is Box {
  return shape.type === Shape.BOX;
}

function isCapsule(shape: Shape): shape is Capsule {
  return shape.type === Shape.CAPSULE;
}

function isConvex(shape: Shape): shape is Convex {
  return shape.type === Shape.CONVEX;
}

function isCircle(shape: Shape): shape is Circle {
  return shape.type === Shape.CIRCLE;
}

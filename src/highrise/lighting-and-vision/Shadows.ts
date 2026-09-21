import { AABB } from "../../core/physics/collision/AABB";
import type { Body } from "../../core/physics/body/Body";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import { getShapeCorners } from "./shapeUtils";
/**
 * Draws shadows from a given point
 *
 * Resources:
 * https://www.redblobgames.com/articles/visibility/
 * https://stackoverflow.com/questions/55855767/algorithm-to-determine-back-sides-of-a-polygon
 * https://archive.gamedev.net/archive/reference/programming/features/2dsoftshadow/page3.html
 */
export class Shadows extends BaseEntity implements Entity {
  dirty: boolean = true;
  graphics: Graphics;

  constructor(
    private lightPos: V2d,
    private radius: number = 10,
    private checkDynamicBodies = false,
  ) {
    super();
    this.graphics = new Graphics();
    // this.graphics.blendMode = "multiply";
  }

  setPosition(position: V2d) {
    this.lightPos = position;
    this.dirty = true;
  }

  setRadius(radius: number) {
    this.radius = radius;
    this.dirty = true;
  }

  updateIfDirty() {
    if (this.dirty) {
      this.forceUpdate();
    }
  }

  forceUpdate() {
    this.graphics.clear();

    const shadows = this.getShadowCorners();

    for (const corners of shadows) {
      if (corners.length) {
        this.graphics.poly(corners.flat()).fill(0x000000);
      }
    }

    this.dirty = false;
  }

  private getShadowCorners(): [number, number][][] {
    const [lightX, lightY] = this.lightPos;
    const shadows: [number, number][][] = [];
    // TODO: This won't always reach the end of the light, it needs either to be suuuper long, or to add more points
    const shadowDistance = 10 * this.radius;

    // The point you get by going from the light through `point` for `shadowDistance`
    const project = (point: V2d): [number, number] => {
      const dx = point[0] - lightX;
      const dy = point[1] - lightY;
      const scale = shadowDistance / (Math.hypot(dx, dy) || 1);
      return [point[0] + dx * scale, point[1] + dy * scale];
    };

    for (const body of this.getAffectedBodies()) {
      for (const shape of body.shapes) {
        const corners = getShapeCorners(shape, body);
        const shadowPoints: [number, number][] = [];
        const edgesVisible: boolean[] = [];

        // Figure out which faces are visible
        for (let i = 0; i < corners.length; i++) {
          const a = corners[i];
          const b = corners[(i + 1) % corners.length];
          // The edge's normal (rotated 90 degrees clockwise), dotted with
          // the direction from the light to the edge
          const normalX = b[1] - a[1];
          const normalY = -(b[0] - a[0]);
          const dot = (a[0] - lightX) * normalX + (a[1] - lightY) * normalY;
          edgesVisible.push(dot <= 0);
        }

        for (let i = 1; i < corners.length + 1; i++) {
          const point = corners[i % corners.length];
          const previousEdge = edgesVisible[i - 1];
          const nextEdge = edgesVisible[i % edgesVisible.length];

          if (previousEdge && !nextEdge) {
            // left breaking point
            shadowPoints.push([point[0], point[1]]);
            shadowPoints.push(project(point));
          } else if (!previousEdge && nextEdge) {
            // right breaking point
            shadowPoints.push(project(point));
            shadowPoints.push([point[0], point[1]]);
          } else if (previousEdge && nextEdge) {
            // front side
            shadowPoints.push([point[0], point[1]]);
          } else {
            // back side
            shadowPoints.push(project(point));
          }
        }

        // Make everything relative to the light position
        for (const point of shadowPoints) {
          point[0] -= lightX;
          point[1] -= lightY;
        }

        shadows.push(shadowPoints);
      }
    }

    return shadows;
  }

  // Returns the nearby bodies that cast a shadow
  getAffectedBodies(): Body[] {
    const center = this.lightPos;
    const world = this.game!.world;
    const aabb = new AABB({
      lowerBound: center.sub([this.radius, this.radius]),
      upperBound: center.add([this.radius, this.radius]),
    });
    const result: Body[] = [];
    for (const body of world.broadphase.aabbQuery(
      world,
      aabb,
      this.checkDynamicBodies,
    )) {
      if (body.owner?.tags?.includes("cast_shadow")) {
        result.push(body);
      }
    }
    return result;
  }
}

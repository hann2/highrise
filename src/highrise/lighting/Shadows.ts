import { AABB, Body } from "p2";
import { BLEND_MODES, Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { WithOwner } from "../../core/entity/Entity";
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

  constructor(private lightPos: V2d, private radius: number = 10) {
    super();
    this.graphics = new Graphics();
    // this.graphics.blendMode = BLEND_MODES.MULTIPLY;
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
      this.graphics.clear();

      const shadows = this.getShadowCorners();

      for (const corners of shadows) {
        if (corners.length) {
          this.graphics
            .beginFill(0x000000)
            .drawPolygon(
              corners
                // TODO: Do we really want this translation here?
                .map(([x, y]) => [x - this.lightPos.x, y - this.lightPos.y])
                .flat()
            )
            .endFill();
        }
      }

      this.dirty = false;
    }
  }

  // TODO: This is really slow. Ideas for fixing
  //   - Don't use V2ds anywhere, and try to keep allocation down in general.
  //     This would probably at least double the speed of this.
  private getShadowCorners(): [number, number][][] {
    const lightPos = this.lightPos;
    const bodies = this.getAffectedBodies();
    const shadows: [number, number][][] = [];

    for (const body of bodies) {
      for (const shape of body.shapes) {
        // TODO: Don't use V2d anywhere here, and try to eliminate as much allocation as possible
        const corners = getShapeCorners(shape, body, lightPos);
        const shadowPoints: [number, number][] = [];
        const edgesVisible: boolean[] = [];

        // Figure out which faces are visible
        for (let i = 0; i < corners.length; i++) {
          const a = corners[i % corners.length];
          const b = corners[(i + 1) % corners.length];
          const edgeNormal = b.sub(a);
          edgeNormal.irotate90cw();
          const centerNormal = a.sub(lightPos);

          const dot = edgeNormal.dot(centerNormal);
          edgesVisible.push(dot <= 0);
        }

        for (let i = 1; i < corners.length + 1; i++) {
          const point = corners[i % corners.length];
          const previousEdge = edgesVisible[i - 1];
          const nextEdge = edgesVisible[i % edgesVisible.length];

          const shadowDistance = 2 * this.radius;
          if (previousEdge && !nextEdge) {
            // left breaking point
            shadowPoints.push(point);
            shadowPoints.push(displacePoint(point, lightPos, shadowDistance));
          } else if (!previousEdge && nextEdge) {
            // right breaking point
            shadowPoints.push(displacePoint(point, lightPos, shadowDistance));
            shadowPoints.push(point);
          } else if (previousEdge && nextEdge) {
            // front side
            shadowPoints.push(point);
          } else {
            // back side
            shadowPoints.push(displacePoint(point, lightPos, shadowDistance));
          }
        }

        // TODO: This won't always reach the end of the light, it needs either to be suuuper long, or to add more points

        shadows.push(shadowPoints);
      }
    }

    return shadows;
  }

  // Returns the nearby bodies that cast a shadow
  getAffectedBodies() {
    const center = this.lightPos;
    const world = this.game!.world;
    return world.broadphase
      .aabbQuery(
        world,
        new AABB({
          lowerBound: center.sub([this.radius, this.radius]),
          upperBound: center.add([this.radius, this.radius]),
        })
      )
      .filter((body: Body & WithOwner) =>
        body.owner?.tags?.includes?.("cast_shadow")
      );
  }
}

function displacePoint(point: V2d, lightPos: V2d, distance: number): V2d {
  const displacement = point.sub(lightPos).inormalize().imul(distance);
  return displacement.iadd(point);
}

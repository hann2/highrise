import { AABB, Body, vec2 } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { WithOwner } from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import light from "./light.frag";
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
      this.forceUpdate();
    }
  }

  forceUpdate() {
    this.graphics.clear();

    const shadows = this.getShadowCorners();

    for (const corners of shadows) {
      if (corners.length) {
        this.graphics.beginFill(0x000000).drawPolygon(corners.flat()).endFill();
      }
    }

    this.dirty = false;
  }

  private getShadowCorners(): [number, number][][] {
    const lightPos = this.lightPos;
    const bodies = this.getAffectedBodies();
    const shadows: [number, number][][] = [];

    for (const body of bodies) {
      for (const shape of body.shapes) {
        const corners = getShapeCorners(shape, body, lightPos);
        const shadowPoints: [number, number][] = [];
        const edgesVisible: boolean[] = [];

        // Declare here so we can reuse them and avoid allocations.
        // Though that may be worse for cache? I don't know with JavaScript
        const edgeNormal = vec2.create();
        const centerNormal = vec2.create();

        // Figure out which faces are visible
        for (let i = 0; i < corners.length; i++) {
          const a = corners[i % corners.length];
          const b = corners[(i + 1) % corners.length];
          vec2.sub(edgeNormal, b, a);
          vec2.rotate90cw(edgeNormal, edgeNormal);
          vec2.sub(centerNormal, a, lightPos);
          const dot = vec2.dot(centerNormal, edgeNormal);
          edgesVisible.push(dot <= 0);
        }

        for (let i = 1; i < corners.length + 1; i++) {
          const point = corners[i % corners.length];
          const previousEdge = edgesVisible[i - 1];
          const nextEdge = edgesVisible[i % edgesVisible.length];

          // TODO: This won't always reach the end of the light, it needs either to be suuuper long, or to add more points
          const shadowDistance = 10 * this.radius;
          if (previousEdge && !nextEdge) {
            // left breaking point
            shadowPoints.push(point);
            shadowPoints.push(
              getDisplacedPoint(point, lightPos, shadowDistance)
            );
          } else if (!previousEdge && nextEdge) {
            // right breaking point
            shadowPoints.push(
              getDisplacedPoint(point, lightPos, shadowDistance)
            );
            shadowPoints.push(point);
          } else if (previousEdge && nextEdge) {
            // front side
            shadowPoints.push(point);
          } else {
            // back side
            shadowPoints.push(
              getDisplacedPoint(point, lightPos, shadowDistance)
            );
          }
        }

        shadows.push(shadowPoints);
      }
    }

    // Make everything relative to the light position
    for (let i = 0; i < shadows.length; i++) {
      shadows[i] = shadows[i].map((corner) => [
        corner[0] - lightPos[0],
        corner[1] - lightPos[1],
      ]);
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

// Returns a new point that is the projection from point to lightPos out to given distance
function getDisplacedPoint(
  point: [number, number],
  lightPos: [number, number],
  distance: number
): [number, number] {
  const result = vec2.create();
  vec2.sub(result, point, lightPos);
  vec2.normalize(result, result);
  vec2.scale(result, result, distance);
  vec2.add(result, result, point);
  return result;
}

import {
  AABB,
  Body,
  Box,
  Convex,
  Line,
  Ray,
  RaycastResult,
  Shape,
  World,
} from "p2";
import { Graphics, PI_2 } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { WithOwner } from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";

// See https://www.redblobgames.com/articles/visibility/
//
// TODO: Performance improvements
//     - Bound the graphics class
//     - Only find necessary shapes
//     - Keep track of walls to reduce number of triangles
//     - Don't use V2d
export class Shadows extends BaseEntity implements Entity {
  shadowGraphics: Graphics;

  constructor(private position: V2d, private radius: number = 10) {
    super();

    this.shadowGraphics = new Graphics();
    // this.shadowGraphics.filters = [new Pixi.filters.BlurFilter(20)];

    // I guess this makes sure that the shadow is in the world?
    this.sprite = this.shadowGraphics;
  }

  onAdd() {
    this.update();
  }

  setPosition(position: V2d) {
    this.position = position;
    if (this.game) {
      this.update();
    } else {
      console.trace("updating shadow before added");
    }
  }

  setRadius(radius: number) {
    this.radius = radius;
    if (this.game) {
      this.update();
    } else {
      console.trace("updating shadow before added");
    }
  }

  update() {
    this.shadowGraphics.clear();

    const corners = this.getShadowCorners(this.position);

    if (corners.length) {
      this.shadowGraphics.beginFill(0xffffff);
      const lastCorner = corners[corners.length - 1];
      this.shadowGraphics.moveTo(lastCorner[0], lastCorner[1]);
      for (const corner of corners) {
        this.shadowGraphics.lineTo(corner[0], corner[1]);
      }
      this.shadowGraphics.endFill();
    }
  }

  // TODO: This is really slow
  private getShadowCorners(center: V2d): [number, number][] {
    // const bodies = this.game!.entities.getTagged("cast_shadow");

    const world = this.game!.world;
    const bodies = world.broadphase
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

    const corners: V2d[] = [];

    for (const body of bodies) {
      for (const shape of body.shapes) {
        corners.push(...getShapeCorners(shape, body, center));
      }
    }

    corners.sort((a, b) => a.sub(center).angle - b.sub(center).angle);

    return corners.map((corner) =>
      shadowRaycast(center, corner, this.game!.world)
    );
  }
}

// Casts a ray towards a corner and returns the hit point
function shadowRaycast(
  center: [number, number],
  corner: [number, number],
  world: World
): [number, number] {
  const ray = new Ray({
    mode: Ray.CLOSEST,
    from: center,
    to: corner,
    skipBackfaces: true,
    collisionMask: CollisionGroups.ShadowCaster,
    // TODO: Check that owner is a shadowcaster. Maybe just do that with collision groups?
  });
  const result = new RaycastResult();
  world.raycast(result, ray);

  if (result.hasHit()) {
    const hitPoint: [number, number] = [0, 0];
    result.getHitPoint(hitPoint, ray);
    return hitPoint;
  } else {
    return corner;
  }
}

// Returns the "corners" of a shape
function getShapeCorners(shape: Shape, body: Body, center: V2d): V2d[] {
  switch (shape.type) {
    case Shape.BOX:
    case Shape.CONVEX: {
      const convex = shape as Box | Convex;
      const points = [];
      for (const vertex of convex.vertices) {
        const point = V(0, 0);
        body.toWorldFrame(point, vertex);
        points.push(point);
      }
      return points;
    }
    case Shape.CAPSULE:
      return []; // TODO this one seems a bit tricky, could probably approximate
    case Shape.CIRCLE:
      return []; // TODO: Just a few points on the edge? Really I suppose we want to draw the curve in the shadow, but that's a whole nother level of complexity
    case Shape.LINE:
      const line = shape as Line;
      const start = V(-line.length / PI_2, 0);
      const end = V(line.length / 2, 0);
      body.toWorldFrame(start, start);
      body.toWorldFrame(end, end);
      return [start, end];
    case Shape.HEIGHTFIELD:
      return []; // I don't think we really need these
    case Shape.PARTICLE:
      return []; // Particles don't cast shadows
    case Shape.PLANE:
      return []; // Let's just not use planes
    default:
      return []; // In case I missed one
  }
}

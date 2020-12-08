import { AABB, Body, Box, Convex, Line, Shape } from "p2";
import { Container, Graphics, PI_2, RenderTexture, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { WithOwner } from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
/**
 * Draws shadows from a given point
 *
 * Resources:
 * https://www.redblobgames.com/articles/visibility/
 * https://stackoverflow.com/questions/55855767/algorithm-to-determine-back-sides-of-a-polygon
 * https://archive.gamedev.net/archive/reference/programming/features/2dsoftshadow/page3.html
 */
export class ShadowMask extends BaseEntity implements Entity {
  mask: Container;
  texture: RenderTexture;
  dirty: boolean = true;
  private graphics: Graphics;

  constructor(private position: V2d, private radius: number = 10) {
    super();

    this.texture = this.texture = RenderTexture.create({
      width: radius * 100,
      height: radius * 100,
      resolution: 10,
    });
    const mask = (this.mask = new Sprite(this.texture));
    // mask.anchor.set(0.5, 0.5);
    mask.scale.set(100);
    this.graphics = new Graphics();

    // I guess this makes sure that the shadow is in the world?
    // this.sprite = this.graphics;
  }

  setPosition(position: V2d) {
    this.position = position;
    this.dirty = true;
  }

  setRadius(radius: number) {
    this.radius = radius;
    this.dirty = true;
  }

  afterPhysics() {
    if (this.game && this.dirty) {
      this.update();
    }
  }

  update() {
    this.graphics.clear();

    // Start with everything black for visible
    const r = this.radius;
    const [cx, cy] = this.position;
    this.graphics
      .beginFill(0xfffff)
      .drawCircle(cx, cy, r * 10.5)
      // .drawRect(cx - r, cy - r, 2 * r, 2 * r)
      .endFill();

    const shadows = this.getShadowCorners();

    for (const corners of shadows) {
      if (corners.length) {
        this.graphics.beginFill(0xffffff);
        // this.graphics.drawPolygon(corners.flat());
        this.graphics.endFill();
      }
    }

    this.game!.renderer.pixiRenderer.render(this.graphics, this.texture);

    this.dirty = false;
  }

  // TODO: This is really slow. Ideas for fixing
  //   - Don't use V2ds anywhere, and try to keep allocation down in general
  private getShadowCorners(): [number, number][][] {
    const center = this.position;
    // const bodies = this.game!.entities.getTagged("cast_shadow");

    const bodies = this.getAffectedBodies();

    const shadows: [number, number][][] = [];

    for (const body of bodies) {
      for (const shape of body.shapes) {
        const corners = getShapeCorners(shape, body, center);
        const shadowPoints: [number, number][] = [];

        // TODO: Don't use V2d
        for (let i = 0; i < corners.length; i++) {
          const a = corners[i % corners.length];
          const b = corners[(i + 1) % corners.length];
          const edgeNormal = b.sub(a);
          edgeNormal.rotate90cw();
          const centerNormal = a.sub(center);

          const dot = edgeNormal.dot(centerNormal);

          // Is backfacing
          if (dot <= 0) {
            const displacement = centerNormal.normalize();
            const endThing = a.add(displacement);
            shadowPoints.push(endThing);
          } else {
            shadowPoints.push(a);
          }
        }
        // TODO:
        //   get back-facing corners
        //   project a point for each back-facing corner out to the shadow radius
        //   return combined array of all these points
        shadows.push(shadowPoints);
      }
    }

    return shadows;
  }

  // Returns the nearby bodies that cast a shadow
  getAffectedBodies() {
    const center = this.position;
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

// Returns the "corners" of a shape in world coordinates
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

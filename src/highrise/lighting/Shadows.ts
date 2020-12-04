import { Shape, Body, Box, Convex, Line, Ray, RaycastResult, World } from "p2";
import { Graphics, PI_2, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { Layers } from "../layers";


// See https://www.redblobgames.com/articles/visibility/
// 
// TODO: Performance improvements
//     - Bound the graphics class
//     - Only find necessary shapes
//     - Keep track of walls to reduce number of triangles
export class Shadows extends BaseEntity implements Entity {
    shadowGraphics: Graphics;

    constructor(private radius: number = 10) {
        super();

        this.shadowGraphics = new Graphics();
    }

    setPosition(position: V2d) {
        this.update(position);
    }

    update(position: V2d) {
        this.shadowGraphics.clear();

        const corners = this.getShadowCorners(position);

        if (corners.length) {
            this.shadowGraphics.beginFill(0xffffff);
            const lastCorner = corners[corners.length - 1];
            this.shadowGraphics.moveTo(lastCorner[0], lastCorner[1])
            for (const corner of corners) {
                this.shadowGraphics.lineTo(corner[0], corner[1]);
            }
            this.shadowGraphics.endFill();
        } else {
            console.log('no shadow casters');
        }
    }

    private getShadowCorners(center: V2d): V2d[] {
        if (!this.game) {
            console.log("no shadows yet")
            return [];
        }

        const bodies = this.game!.entities.getTagged('cast_shadow');

        const corners: V2d[] = [];

        for (const entity of bodies) {
            if (entity.body) {
                for (const shape of entity.body.shapes) {
                    corners.push(...getShapeCorners(shape, entity.body, center))
                }
            }
        }

        corners.sort((a, b) => a.sub(center).angle - b.sub(center).angle);

        return corners.map(corner => shadowRaycast(center, corner, this.game!.world));
    }
}

// Casts a ray towards a corner and returns the hit point
function shadowRaycast(center: V2d, corner: V2d, world: World): V2d {
    const ray = new Ray({
        mode: Ray.CLOSEST,
        from: center,
        to: corner,
        skipBackfaces: true,
        collisionMask: CollisionGroups.World,
        // TODO: Check that owner is a shadowcaster. Maybe just do that with collision groups?
    });
    const result = new RaycastResult();
    world.raycast(result, ray);

    if (result.hasHit()) {
        const hitPoint = V(0, 0);
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
            return [] // TODO this one seems a bit tricky, could probably approximate
        case Shape.CIRCLE:
            return [] // TODO: Just a few points on the edge? Really I suppose we want to draw the curve in the shadow, but that's a whole nother level of complexity
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
    }
}
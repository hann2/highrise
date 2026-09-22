import Game from "../../core/Game";
import type { Body } from "../../core/physics/body/Body";
import { AABB } from "../../core/physics/collision/AABB";
import { V2d } from "../../core/Vector";
import { getShapeCorners } from "./shapeUtils";
import type { Occluder } from "./visibility";

/** Entities with this tag block light and vision */
export const CAST_SHADOW_TAG = "cast_shadow";

/** The bodies within `radius` of `center` that cast shadows */
export function getShadowCasters(
  game: Game,
  center: V2d,
  radius: number,
  includeDynamic: boolean,
): Body[] {
  const world = game.world;
  const aabb = new AABB({
    lowerBound: center.sub([radius, radius]),
    upperBound: center.add([radius, radius]),
  });
  const result: Body[] = [];

  // Static casters (walls) come from the broadphase hash. Asking it for
  // moving bodies too would make it hash every dynamic body in the world
  // for each query, and only a handful of them (doors) cast shadows.
  for (const body of world.broadphase.aabbQuery(world, aabb, false)) {
    if (body.owner?.tags?.includes(CAST_SHADOW_TAG)) {
      result.push(body);
    }
  }

  if (includeDynamic) {
    for (const entity of game.entities.getTagged(CAST_SHADOW_TAG)) {
      const body = entity.body;
      if (body && body.motion !== "static" && body.getAABB().overlaps(aabb)) {
        result.push(body);
      }
    }
  }

  return result;
}

/** The shadow casters near `center` as polygons for the visibility computation */
export function getOccluders(
  game: Game,
  center: V2d,
  radius: number,
  includeDynamic: boolean,
): Occluder[] {
  const occluders: Occluder[] = [];
  for (const body of getShadowCasters(game, center, radius, includeDynamic)) {
    for (const shape of body.shapes) {
      const corners = getShapeCorners(shape, body);
      if (corners.length >= 2) {
        occluders.push({ corners, transmission: 0 });
      }
    }
  }
  return occluders;
}

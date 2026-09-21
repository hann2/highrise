// Assign things to groups so that we can easily enable/disable collisions between different groups

import { makeCollisionGroups } from "../core/util/CollisionGroupUtils";

export const CollisionGroups = makeCollisionGroups([
  "Walls",
  "Furniture",
  "Humans",
  "Enemies",
  "Projectiles",
  "Sensors",
  "CastsShadow",
  "Shadow",
  "Particle",
] as const);

export type CollisionGroupName = keyof typeof CollisionGroups;

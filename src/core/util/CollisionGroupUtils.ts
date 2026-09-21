import {
  CollisionGroupName,
  CollisionGroups,
} from "../../config/CollisionGroups";
import { objectKeys } from "./ObjectUtils";

let _collisionGroupIndex = 0;

/** Use when making collision groups */
export function makeCollisionGroup() {
  return 1 << _collisionGroupIndex++;
}

export function collisionGroupToNames(group: number): CollisionGroupName[] {
  if (group === CollisionGroups.All) {
    return ["All"];
  }
  // Don't look at CollisionGroups at the top level of this module, because
  // config/CollisionGroups imports this module to create the groups.
  return objectKeys(CollisionGroups).filter(
    (name) => name !== "All" && group & CollisionGroups[name],
  );
}

export function collisionGroupsToNumber(
  groups: ReadonlyArray<CollisionGroupName>,
): number {
  return groups.reduce<number>(
    (acc, group) => acc | CollisionGroups[group],
    CollisionGroups.None,
  );
}

/**
 * Creates a collision group registry from an array of group names.
 * Automatically generates bit mask values and includes 'All' and 'None' groups.
 */
export function makeCollisionGroups<const T extends readonly string[]>(
  groupNames: T,
): Record<T[number] | "All" | "None", number> {
  const groups: Record<string, number> = {
    None: 0,
  };

  for (const name of groupNames) {
    groups[name] = makeCollisionGroup();
  }

  groups.All = Object.values(groups)
    .filter((value) => value !== 0)
    .reduce((acc, group) => acc | group, 0);

  return groups as Record<T[number] | "All" | "None", number>;
}

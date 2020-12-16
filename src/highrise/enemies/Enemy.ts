import type Entity from "../../core/entity/Entity";
import Heavy from "./Heavy";
import Necromancer from "./Necromancer";
import Spitter from "./Spitter";
import Zombie from "./Zombie";

export type Enemy = Heavy | Necromancer | Spitter | Zombie;

// TODO: This is brittle. We should do a bit more somewhere
export function isEnemy(e: Entity): e is Enemy {
  return (
    e instanceof Necromancer ||
    e instanceof Spitter ||
    e instanceof Heavy ||
    e instanceof Zombie
  );
}

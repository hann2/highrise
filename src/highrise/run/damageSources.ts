import type { BaseEnemy } from "../enemies/base/Enemy";
import type Human from "../human/Human";

/** An enemy, or a name for things that aren't one (like a stray projectile) */
export type DamageSource = BaseEnemy | string;

// Who hurt each human last, so a death can be blamed on someone
const lastDamageSources = new WeakMap<Human, DamageSource>();

/** Hurts a human and remembers who did it, for the run summary's cause of death. */
export function inflictDamageFrom(
  human: Human,
  amount: number,
  source: DamageSource,
) {
  lastDamageSources.set(human, source);
  human.inflictDamage(amount);
}

export function getLastDamageSource(human: Human): DamageSource | undefined {
  return lastDamageSources.get(human);
}

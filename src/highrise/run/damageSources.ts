import type { BaseEnemy } from "../enemies/base/Enemy";
import type Human from "../human/Human";

/** An enemy, or a name for things that aren't one (like a stray projectile) */
export type DamageSource = BaseEnemy | string;

// Who hurt each human last, so a death can be blamed on someone
const lastDamageSources = new WeakMap<Human, DamageSource>();

/**
 * Hurts a human and remembers who did it, for the run summary's cause of
 * death, scaled by the enemy's `damageScale`. See `Human.inflictDamage` for
 * `quiet`.
 */
export function inflictDamageFrom(
  human: Human,
  amount: number,
  source: DamageSource,
  quiet: boolean = false,
) {
  lastDamageSources.set(human, source);
  // Enemies hit harder in later acts
  const scale = typeof source === "string" ? 1 : source.damageScale;
  human.inflictDamage(amount * scale, quiet);
}

export function getLastDamageSource(human: Human): DamageSource | undefined {
  return lastDamageSources.get(human);
}

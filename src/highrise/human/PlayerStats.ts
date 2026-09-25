/**
 * Per-human modifiers on top of the constants in `Human` and the shared,
 * read-only `GunStats`. Everything defaults to neutral (1× or 0/off), so a
 * human who never picked an upgrade (allies, survivors) plays exactly as
 * before. Upgrades change these; the code that uses them reads them at use
 * time, so changes take effect immediately.
 */
export class PlayerStats {
  // --- Movement and health ---
  /** Multiplier on walking speed, hurt or not */
  moveSpeed = 1;
  /** Maximum hit points */
  maxHp = 100;

  // --- Weapons ---
  /** Multiplier on damage dealt by bullets and melee weapons */
  damage = 1;
  /** Multiplier on reload speed: 2 reloads in half the time */
  reloadSpeed = 1;
  /** Multiplier on a gun's rounds per second */
  fireRate = 1;
  /** Multiplier on a gun's bullet spread: less is more accurate */
  spread = 1;
  /** Multiplier on a gun's magazine size (rounded, never below the gun's own) */
  magazineSize = 1;

  // --- Push ---
  /** Damage a push does, before the `damage` multiplier */
  pushDamage = 10;
  /** Multiplier on how hard a push shoves enemies */
  pushKnockback = 1;
  /** Multiplier on how long a push stuns enemies */
  pushStun = 1;

  // --- Seeing ---
  /** Multiplier on the flashlight's reach */
  flashlightRange = 1;
  /** Multiplier on how far the player can see (fog of war). Only matters for the leader. */
  visionRange = 1;

  // --- Rules (see `upgrades/ruleUpgrades.ts`) ---
  /** HP healed on killing an enemy with a melee weapon */
  meleeKillHeal = 0;
  /** Reloading an empty gun is instant */
  instantEmptyReload = false;
  /** Crawlers die from any hit */
  oneHitCrawlers = false;
  /** HP healed at the start of every floor */
  floorHeal = 0;
  /** Extra chance that a kill drops an ammo box */
  killAmmoDropChance = 0;
  /** Bullets set what they hit on fire */
  incendiaryRounds = false;
}

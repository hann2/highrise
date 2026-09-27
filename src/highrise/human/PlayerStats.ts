/**
 * Per-human modifiers on top of the constants in `Human` and the shared,
 * read-only `GunStats`. Everything defaults to neutral (1× or 0/off), so a
 * human who never bought an item (allies, survivors) plays exactly as
 * before. Items change these; the code that uses them reads them at use
 * time, so changes take effect immediately.
 */
export class PlayerStats {
  // --- Movement and health ---
  /** Multiplier on walking speed, hurt or not */
  moveSpeed = 1;
  /** Maximum hit points */
  maxHp = 100;
  /** Multiplier on damage taken: less is tougher */
  damageTaken = 1;
  /** Multiplier on how much faster sprinting is (see `SPRINT_MULTIPLIER`) */
  sprintSpeed = 1;
  /** Sprinting doesn't stop you shooting or reloading */
  canShootWhileSprinting = false;

  // --- Weapons ---
  /** Multiplier on damage dealt by bullets and melee weapons */
  damage = 1;
  /** Multiplier on reload speed: 2 reloads in half the time */
  reloadSpeed = 1;
  /** Multiplier on a gun's rounds per second */
  fireRate = 1;
  /** Multiplier on a gun's bullet spread: less is more accurate */
  spread = 1;

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

  // --- Rules (see `items/equipment.ts`) ---
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
  /** Times a shotgun pellet bounces off walls */
  shotgunRicochets = 0;
  /** Multiplier on the damage of the last round in a magazine */
  lastRoundDamage = 1;
  /** A kill with a pistol puts the round back in the magazine */
  pistolKillRefund = false;
  /** Multiplier on rifle damage beyond `LONG_RANGE` (see `Bullet`) */
  rifleLongRangeDamage = 1;
  /** Multiplier on the quarters enemies drop for the leader */
  quarterMultiplier = 1;
  /** Times dying becomes a second chance instead (see `Human.inflictDamage`) */
  extraLives = 0;
  /** Seconds of a stim's effect at the start of every floor */
  floorStimSeconds = 0;
}

/** The stats that are numbers (multipliers and amounts), not rule flags */
export type NumericStat = {
  [K in keyof PlayerStats]: PlayerStats[K] extends number ? K : never;
}[keyof PlayerStats];

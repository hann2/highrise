import { SoundName } from "../../../../resources/resources";

/** A sound played when a consumable goes off */
export interface DetonationSound {
  readonly name: SoundName;
  /** Playback speed: below 1 is lower and longer */
  readonly speed: number;
  readonly gain: number;
}

/**
 * A thrown, one-use item (grenades and the like). Thrown with G / LB; goes off
 * when its fuse runs out. Everything it does is described here and carried out
 * by `ThrownConsumable` and `Detonation`. The list of them is in
 * `consumable-stats/consumableStats.ts`.
 */
export interface ConsumableStats {
  readonly name: string;
  /** One line for upgrade cards and pickups */
  readonly description: string;
  /** Most of these one human can carry */
  readonly maxCarry: number;

  // --- Throwing ---
  /** Meters per second out of the hand */
  readonly throwSpeed: number;
  /** Seconds from leaving the hand to going off */
  readonly fuseTime: number;

  // --- Looks ---
  /** Length and width in meters */
  readonly size: [number, number];
  readonly color: number;
  readonly accentColor: number;

  // --- Going off. Everything only reaches enemies with a clear line to it. ---
  /** Damage right at the center, falling off linearly to 0 at `damageRadius` */
  readonly damage: number;
  /** Meters */
  readonly damageRadius: number;
  /** Knockback at the center, falling off like the damage */
  readonly knockback: number;
  /** Enemies within this many meters are stunned */
  readonly stunRadius: number;
  /** Seconds */
  readonly stunDuration: number;
  /** A bright, short light */
  readonly flash: {
    readonly radius: number;
    readonly color: number;
    readonly intensity: number;
    /** Seconds to fade out */
    readonly duration: number;
  };
  /** An expanding ring drawn on the floor */
  readonly blastRing?: {
    readonly radius: number;
    readonly color: number;
  };
  readonly sounds: {
    readonly detonate: ReadonlyArray<DetonationSound>;
    readonly bounce: ReadonlyArray<SoundName>;
  };
}

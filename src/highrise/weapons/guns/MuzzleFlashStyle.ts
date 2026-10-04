/** A number, or a range each flash picks its own from */
export type Spread = number | readonly [number, number];

/**
 * One tongue of fire in a muzzle flash: a teardrop of heat that starts round
 * at its origin, swells, and tapers to a point. Lengths are in meters, in the
 * gun's frame with the muzzle at the origin and x forward.
 */
export interface FlashLobe {
  /** Radians from straight ahead, positive to the gun's right */
  readonly angle: Spread;
  readonly length: Spread;
  /** Half its width at its widest */
  readonly width: Spread;
  /** How hot it burns: 1 is ordinary, and where lobes overlap their heat adds up */
  readonly heat?: Spread;
  /** Where it starts, if not at the muzzle (the revolver's cylinder gap) */
  readonly origin?: readonly [number, number];
  /** The chance a flash has it at all, if not every time */
  readonly chance?: number;
}

/**
 * How a gun's muzzle flash looks (`MuzzleFlash`): the lobes of fire it's made
 * of, each with ranges every flash picks from, so no two are the same, and
 * how it burns. The shape is the gun's character (a rifle's flash hider
 * splits it into prongs, a revolver spits fire from the cylinder gap, a
 * shotgun throws a wide fat plume) and the ranges make each shot its own.
 */
export interface MuzzleFlashStyle {
  readonly lobes: readonly FlashLobe[];
  /** Seconds it lasts */
  readonly duration: Spread;
  /** How much noise tears up its edges and breaks it into tongues as it dies, 0 to 1 */
  readonly turbulence: number;
  /** How hot its colors are: higher is whiter, lower redder. 1 is ordinary */
  readonly temperature: number;
  /** The whole flash turns up to this many radians either way */
  readonly wobble?: number;
  /** The light it throws, at its brightest */
  readonly light: {
    readonly intensity: number;
    readonly radius: number;
    readonly color: number;
  };
}

/** `lobe` twice, mirrored either side of the barrel */
export function mirrored(lobe: FlashLobe): FlashLobe[] {
  const flip = (s: Spread): Spread =>
    typeof s === "number" ? -s : [-s[1], -s[0]];
  return [
    lobe,
    {
      ...lobe,
      angle: flip(lobe.angle),
      origin: lobe.origin && [lobe.origin[0], -lobe.origin[1]],
    },
  ];
}

/** `count` lobes fanned evenly across `spread` radians, each jittered by up to `jitter` */
export function fan(
  count: number,
  spread: number,
  jitter: number,
  lobe: Omit<FlashLobe, "angle">,
): FlashLobe[] {
  const lobes: FlashLobe[] = [];
  for (let i = 0; i < count; i++) {
    const angle = count === 1 ? 0 : -spread / 2 + (spread * i) / (count - 1);
    lobes.push({ ...lobe, angle: [angle - jitter, angle + jitter] });
  }
  return lobes;
}

/** A plain flash, for guns that don't have their own */
export const DEFAULT_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.1, 0.14], width: [0.1, 0.13], heat: 1.2 },
    { angle: [-0.1, 0.1], length: [0.35, 0.5], width: [0.08, 0.11] },
    ...mirrored({
      angle: [0.5, 0.9],
      length: [0.1, 0.18],
      width: 0.04,
      heat: 0.8,
      chance: 0.6,
    }),
  ],
  duration: [0.05, 0.07],
  turbulence: 0.5,
  temperature: 1,
  wobble: 0.05,
  light: { intensity: 0.8, radius: 12, color: 0xffeeaa },
};

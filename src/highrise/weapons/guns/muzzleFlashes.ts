import { fan, mirrored, MuzzleFlashStyle } from "./MuzzleFlashStyle";

// Each gun's muzzle flash (see `MuzzleFlashStyle`). Lengths in meters, angles
// in radians from straight ahead.

/** 9 mm: a small, tight bloom with a lick of fire either side now and then */
export const GLOCK_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.1, 0.13], width: [0.09, 0.12], heat: 1.1 },
    { angle: [-0.08, 0.08], length: [0.3, 0.42], width: [0.07, 0.09] },
    ...mirrored({
      angle: [0.6, 1.0],
      length: [0.08, 0.15],
      width: 0.035,
      heat: 0.8,
      chance: 0.5,
    }),
  ],
  duration: [0.055, 0.07],
  turbulence: 0.5,
  temperature: 1,
  wobble: 0.05,
  light: { intensity: 0.7, radius: 10, color: 0xffeeaa },
};

/** .45: slower and fatter than the 9 mm, rounder and more orange */
export const M1911_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.13, 0.17], width: [0.12, 0.15], heat: 1.1 },
    { angle: [-0.1, 0.1], length: [0.3, 0.4], width: [0.1, 0.13] },
    ...mirrored({
      angle: [0.4, 0.8],
      length: [0.12, 0.2],
      width: 0.05,
      heat: 0.8,
      chance: 0.7,
    }),
  ],
  duration: [0.06, 0.075],
  turbulence: 0.6,
  temperature: 0.85,
  wobble: 0.06,
  light: { intensity: 0.75, radius: 10, color: 0xffdd99 },
};

/** 5.7 mm: a small, hot, needle-thin jet */
export const FIVE_SEVEN_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.07, 0.1], width: [0.07, 0.09], heat: 1.2 },
    { angle: [-0.04, 0.04], length: [0.4, 0.55], width: [0.04, 0.055] },
    ...mirrored({
      angle: [0.25, 0.4],
      length: [0.15, 0.25],
      width: 0.025,
      heat: 0.7,
      chance: 0.5,
    }),
  ],
  duration: [0.05, 0.06],
  turbulence: 0.35,
  temperature: 1.25,
  wobble: 0.03,
  light: { intensity: 0.6, radius: 9, color: 0xfff4cc },
};

/** .357: a long plume, and fire spat sideways out of the cylinder gap */
export const REVOLVER_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.13, 0.17], width: [0.12, 0.15], heat: 1.2 },
    { angle: [-0.1, 0.1], length: [0.45, 0.6], width: [0.1, 0.13] },
    ...mirrored({
      angle: [1.35, 1.75],
      length: [0.12, 0.22],
      width: [0.04, 0.055],
      heat: 1.1,
      origin: [-0.15, 0.03],
    }),
    {
      angle: [-0.7, 0.7],
      length: [0.12, 0.22],
      width: 0.05,
      heat: 0.7,
      chance: 0.5,
    },
  ],
  duration: [0.055, 0.07],
  turbulence: 0.55,
  temperature: 1,
  wobble: 0.05,
  light: { intensity: 0.9, radius: 12, color: 0xffe6a0 },
};

/** .50 AE: a ball of fire, much too big */
export const DESERT_EAGLE_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.3, 0.4], width: [0.25, 0.32], heat: 1.3 },
    { angle: [-0.12, 0.12], length: [0.6, 0.8], width: [0.18, 0.24] },
    { angle: [-0.8, -0.3], length: [0.3, 0.5], width: [0.1, 0.15] },
    { angle: [0.3, 0.8], length: [0.3, 0.5], width: [0.1, 0.15] },
    {
      angle: [-1.2, 1.2],
      length: [0.25, 0.4],
      width: 0.1,
      heat: 0.8,
      chance: 0.6,
    },
  ],
  duration: [0.08, 0.1],
  turbulence: 0.8,
  temperature: 0.9,
  wobble: 0.1,
  light: { intensity: 1.1, radius: 15, color: 0xffd890 },
};

/** 5.56 out of a flash hider: a star of thin, sharp prongs, little fireball */
export const AR15_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.08, 0.1], width: [0.08, 0.1], heat: 1.2 },
    { angle: [-0.04, 0.04], length: [0.4, 0.55], width: [0.05, 0.065] },
    ...fan(4, 1.3, 0.08, {
      length: [0.25, 0.4],
      width: [0.03, 0.04],
      heat: 1.1,
    }),
  ],
  duration: [0.05, 0.06],
  turbulence: 0.3,
  temperature: 1.2,
  wobble: 0.04,
  light: { intensity: 0.8, radius: 12, color: 0xfff0c0 },
};

/** 7.62 out of a slant brake: a ragged plume, kicked out to one side */
export const AK47_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0.1, length: [0.12, 0.15], width: [0.11, 0.14], heat: 1.1 },
    { angle: [0.05, 0.2], length: [0.5, 0.65], width: [0.1, 0.13] },
    { angle: [0.8, 1.2], length: [0.25, 0.38], width: [0.06, 0.08] },
    { angle: [0.35, 0.6], length: [0.3, 0.42], width: [0.05, 0.07] },
    {
      angle: [-0.5, -0.25],
      length: [0.15, 0.25],
      width: 0.04,
      heat: 0.7,
      chance: 0.5,
    },
  ],
  duration: [0.055, 0.07],
  turbulence: 0.8,
  temperature: 0.85,
  wobble: 0.05,
  light: { intensity: 0.85, radius: 12, color: 0xffdd99 },
};

/** 5.7 mm out of a flash hider: small and dim, a little sparkle */
export const P90_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.06, 0.08], width: [0.06, 0.08], heat: 1 },
    { angle: [-0.05, 0.05], length: [0.18, 0.26], width: [0.035, 0.05] },
    ...fan(3, 1.4, 0.15, {
      length: [0.1, 0.18],
      width: 0.025,
      heat: 0.9,
      chance: 0.7,
    }),
  ],
  duration: [0.045, 0.055],
  turbulence: 0.3,
  temperature: 1.25,
  wobble: 0.05,
  light: { intensity: 0.5, radius: 9, color: 0xfff4d0 },
};

/** 12 gauge: a wide, fat, slow plume that comes apart in tongues */
export const PUMP_SHOTGUN_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.2, 0.26], width: [0.18, 0.22], heat: 1.2 },
    { angle: [-0.08, 0.08], length: [0.7, 0.9], width: [0.2, 0.25] },
    ...fan(4, 0.8, 0.12, {
      length: [0.45, 0.8],
      width: [0.07, 0.1],
      heat: 0.9,
    }),
    ...mirrored({
      angle: [0.6, 0.9],
      length: [0.2, 0.3],
      width: 0.06,
      heat: 0.7,
      chance: 0.5,
    }),
  ],
  duration: [0.075, 0.09],
  turbulence: 0.85,
  temperature: 0.8,
  wobble: 0.06,
  light: { intensity: 1.0, radius: 14, color: 0xffd080 },
};

/** 12 gauge out of a longer barrel: tighter than the pump */
export const SPAS12_FLASH: MuzzleFlashStyle = {
  ...PUMP_SHOTGUN_FLASH,
  lobes: [
    { angle: 0, length: [0.18, 0.22], width: [0.16, 0.2], heat: 1.2 },
    { angle: [-0.06, 0.06], length: [0.7, 0.85], width: [0.17, 0.21] },
    ...fan(4, 0.6, 0.1, {
      length: [0.45, 0.7],
      width: [0.06, 0.08],
      heat: 0.9,
    }),
  ],
  duration: [0.07, 0.085],
};

/**
 * The DP-12: 12 gauge out of 19" barrels through a ported muzzle device, so a
 * pump's plume a little cut short, with jets out of its ports to either side
 */
export const DP12_FLASH: MuzzleFlashStyle = {
  ...PUMP_SHOTGUN_FLASH,
  lobes: [
    { angle: 0, length: [0.18, 0.24], width: [0.17, 0.21], heat: 1.2 },
    { angle: [-0.07, 0.07], length: [0.55, 0.75], width: [0.18, 0.22] },
    ...fan(4, 0.7, 0.1, {
      length: [0.4, 0.65],
      width: [0.06, 0.09],
      heat: 0.9,
    }),
    ...mirrored({
      angle: [1.25, 1.45],
      length: [0.16, 0.24],
      width: [0.06, 0.08],
      heat: 0.85,
      origin: [-0.03, 0.012],
    }),
    ...mirrored({
      angle: [1.2, 1.5],
      length: [0.12, 0.2],
      width: [0.05, 0.07],
      heat: 0.75,
      origin: [-0.06, 0.012],
      chance: 0.7,
    }),
  ],
};

/** 12 gauge out of short barrels: an enormous ragged fan */
export const SAWN_OFF_FLASH: MuzzleFlashStyle = {
  lobes: [
    { angle: 0, length: [0.25, 0.32], width: [0.25, 0.3], heat: 1.3 },
    {
      angle: [-0.12, 0.0],
      length: [0.6, 0.8],
      width: [0.2, 0.25],
      origin: [0, -0.05],
    },
    {
      angle: [0.0, 0.12],
      length: [0.6, 0.8],
      width: [0.2, 0.25],
      origin: [0, 0.05],
    },
    ...fan(5, 1.3, 0.12, {
      length: [0.35, 0.65],
      width: [0.08, 0.11],
      heat: 0.9,
    }),
  ],
  duration: [0.08, 0.1],
  turbulence: 0.9,
  temperature: 0.8,
  wobble: 0.08,
  light: { intensity: 1.1, radius: 15, color: 0xffd080 },
};

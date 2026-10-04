/**
 * The house style every generated body is drawn in. Changing these redraws
 * the whole cast and every zombie, which is the point of generating them.
 * Lengths are millimeters.
 */
export const STYLE = {
  /** Outline width */
  outline: 9,
  /** How much darker than its fill an outline is */
  outlineDarken: 0.5,
  /** White over the top of every rounded shape */
  highlight: 0.22,
  /** Black round its edge */
  shadow: 0.3,
  /** Noise multiplied into fills (frequencies are per mm) */
  grain: {
    cloth: { frequency: 0.09, octaves: 2, strength: 0.12, seed: 3 },
    skin: { frequency: 0.035, octaves: 2, strength: 0.07, seed: 7 },
    rot: { frequency: 0.022, octaves: 3, strength: 0.32, seed: 11 },
    knit: { frequency: "0.03 0.16", octaves: 2, strength: 0.16, seed: 5 },
  },
};

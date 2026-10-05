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
  /**
   * Noise multiplied into rotten skin and grime (frequencies are per mm).
   * Everything else is flat color, lines and gradients.
   */
  rot: { frequency: 0.022, octaves: 3, strength: 0.32, seed: 11 },
};

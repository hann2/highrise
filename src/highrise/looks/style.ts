/**
 * The house style every generated body is drawn in. Changing these redraws
 * the whole cast and every zombie, which is the point of generating them.
 * Lengths are millimeters.
 *
 * There are a few presets to compare (`STYLES`); `setLookStyle` picks one
 * before anything is drawn (`?style=` in the game, `--style` for
 * `bin/look-sheet.ts`).
 */
export interface LookStyle {
  /** Outline width, 0 for none; parts with thinner outlines of their own are scaled to it */
  outline: number;
  /** How much darker than its fill an outline is */
  outlineDarken: number;
  /**
   * How a rounded shape is shaded: `gloss`, a highlight on top and dark
   * round the edge; `soft`, lit from straight above, falling off gently to
   * the edge; `cel`, two flat tones with a hard edge between; `flat`, none
   */
  shading: "gloss" | "soft" | "cel" | "flat";
  /** White over the lit part of a shape, and black round its edge */
  highlight: number;
  shadow: number;
  /** A soft shadow each part casts on what's under it (a head on the shoulders, an arm on the torso) */
  cast?: { blur: number; opacity: number };
  /** Noise multiplied into rotten skin and grime (frequencies are per mm) */
  rot: { frequency: number; octaves: number; strength: number; seed: number };
}

const ROT = { frequency: 0.022, octaves: 3, strength: 0.32, seed: 11 };

export const STYLES = {
  /** Outlined, glossy: the first pass */
  gloss: {
    outline: 9,
    outlineDarken: 0.5,
    shading: "gloss",
    highlight: 0.22,
    shadow: 0.3,
    rot: ROT,
  },
  /** Thin outlines, soft light from above, parts shadowing what's under them */
  soft: {
    outline: 4.5,
    outlineDarken: 0.45,
    shading: "soft",
    highlight: 0.1,
    shadow: 0.3,
    cast: { blur: 10, opacity: 0.4 },
    rot: ROT,
  },
  /** Medium outlines, two tones per shape */
  cel: {
    outline: 7,
    outlineDarken: 0.55,
    shading: "cel",
    highlight: 0,
    shadow: 0.22,
    cast: { blur: 5, opacity: 0.3 },
    rot: ROT,
  },
  /** No outlines: shapes told apart by their light and the shadows they cast */
  minimal: {
    outline: 0,
    outlineDarken: 0.4,
    shading: "soft",
    highlight: 0.12,
    shadow: 0.35,
    cast: { blur: 12, opacity: 0.5 },
    rot: ROT,
  },
} satisfies Record<string, LookStyle>;

export type LookStyleName = keyof typeof STYLES;

/** The style being drawn in */
export const STYLE: LookStyle = { ...STYLES.gloss };

/** Draws everything from now on in another style (before baking) */
export function setLookStyle(name: string) {
  const style = STYLES[name as LookStyleName];
  if (!style) {
    throw new Error(
      `No look style "${name}" (${Object.keys(STYLES).join(", ")})`,
    );
  }
  for (const key of Object.keys(STYLE) as (keyof LookStyle)[]) {
    delete STYLE[key];
  }
  Object.assign(STYLE, style);
}

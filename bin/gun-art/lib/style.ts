/**
 * The colors every gun is drawn in, so guns drawn apart still look like one set. Each material is a base color,
 * a darker one for shadowed faces, edges and steps, a lighter one for lit faces, and a highlight for the bright
 * line where an edge catches the light. Shading runs across a part (top to bottom on a slide) from dark at its
 * edges to light just under its lit edge.
 *
 * Blued steel and walnut are the M1911's, which Simon picked; the rest are starting points, to be tuned on a
 * materials options sheet and then kept here.
 */

export interface Material {
  readonly base: string;
  readonly dark: string;
  readonly light: string;
  readonly highlight: string;
}

/** Blued (or black-finished) steel: the M1911's slide and frame */
export const BLUED_STEEL: Material = {
  base: "#4a4d54",
  dark: "#26282d",
  light: "#6a6e76",
  highlight: "#787d87",
};

/** Bright steel on a dark gun: the M1911's grip safety and trigger */
export const BRIGHT_STEEL: Material = {
  base: "#8d9199",
  dark: "#5e6268",
  light: "#a9adb3",
  highlight: "#c4c7cc",
};

/**
 * A polished barrel, seen through a port or under a slide that's back: very bright, with a hard highlight. The
 * M1911's barrel gradient runs dark edge, highlight, light, base, dark across it.
 */
export const POLISHED_BARREL: Material = {
  base: "#8e929a",
  dark: "#3c3f45",
  light: "#cdd1d6",
  highlight: "#eef0f3",
};

/**
 * Polished stainless (the Desert Eagle, the revolver): very shiny, so lighter than bright steel overall, with
 * strong contrast between its lit and shadowed bands rather than one flat gray. A starting point.
 */
export const POLISHED_STAINLESS: Material = {
  base: "#b4b8be",
  dark: "#6c7178",
  light: "#dfe2e6",
  highlight: "#f7f8fa",
};

/** Black polymer (the Glock's frame): a little warmer and flatter than blued steel, never pure black. A starting point. */
export const BLACK_POLYMER: Material = {
  base: "#35373b",
  dark: "#1d1e21",
  light: "#4a4c51",
  highlight: "#5c5f64",
};

/** Flat dark earth polymer (the Five-seven): a sandy tan. A starting point, from the photo's lit faces. */
export const FDE: Material = {
  base: "#b39572",
  dark: "#7d6447",
  light: "#cbb08d",
  highlight: "#dcc5a5",
};

/** Walnut, the M1911's "cocoa": `base` at a panel's edges, `light` down its middle, `dark` for checkering and outline */
export const WALNUT: Material = {
  base: "#6a3a24",
  dark: "#3e2013",
  light: "#a3633f",
  highlight: "#b97a52",
};

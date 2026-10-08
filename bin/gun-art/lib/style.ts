import type { Point } from "./geometry";
import { fixed } from "./geometry";

/**
 * The colors every gun is drawn in, so guns drawn apart still look like one set. Each material is a base color,
 * a darker one for shadowed faces, edges and steps, a lighter one for lit faces, and a highlight for the bright
 * line where an edge catches the light. Shading runs across a part (top to bottom on a slide) from dark at its
 * edges to light just under its lit edge.
 *
 * Simon picked them on materials options sheets: blued steel and walnut (the M1911's), black nitride (the
 * Glock's slide), FDE (the Five-seven's), the chrome polish (the Desert Eagle's and, with a lighter floor, the
 * revolver's). BLACK_POLYMER and POLISHED_STAINLESS are the first guesses the polished pistols were drawn from.
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

/**
 * Black nitride (the Glock's slide, and its steel parts: the slide stop, the takedown lever, the pins): near
 * black, a touch bluer and darker than the polymer frame.
 */
export const BLACK_NITRIDE: Material = {
  base: "#2b2e34",
  dark: "#15161a",
  light: "#41454e",
  highlight: "#5f6570",
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

/** A front sight's red insert (the revolver's) */
export const SIGHT_RED = "#e8553c";
export const SIGHT_RED_DARK = "#a93424";

// ---------------------------------------------------------------------------------------------------------
// Chrome-like polish (the Desert Eagle, the revolver)

/**
 * Chrome-like polished stainless: each face reflects a bright sky above and a dark floor below, so it's banded
 * rather than shaded: from `sky` at its top fading to `skyLow` at its horizon, a hard drop (`hardness`, as a
 * fraction of the face) to `floor`, rising to `floorLow` at its bottom edge. Edges that catch the light are a
 * line of `edge` with `edgeDark` just below (shading, not outline); the outline round the silhouette is `outline`,
 * a mid gray. Bead-blasted (matte) planes are a step darker and much flatter.
 */
export interface Polish {
  readonly sky: string;
  readonly skyLow: string;
  readonly floor: string;
  readonly floorLow: string;
  /** Where on a face the floor's reflection starts, 0 at its top to 1 at its bottom */
  readonly horizon: number;
  /** How quickly the sky gives way to the floor, as a fraction of the face: 0 is a hard line */
  readonly hardness: number;
  readonly edge: string;
  readonly edgeDark: string;
  /** The outline round the silhouette: a mid gray, never near-black */
  readonly outline: string;
  readonly matte: string;
  readonly matteLight: string;
  readonly matteDark: string;
}

/** The Desert Eagle's: neutral to slightly cool, a hard horizon, a dark floor */
export const CHROME_STAINLESS: Polish = {
  sky: "#f5f7f9",
  skyLow: "#c4c9cf",
  floor: "#3e434a",
  floorLow: "#8c9199",
  horizon: 0.64,
  hardness: 0.02,
  edge: "#ffffff",
  edgeDark: "#25282d",
  outline: "#5b6067",
  matte: "#868b92",
  matteLight: "#a9aeb4",
  matteDark: "#5a5f66",
};

/**
 * The revolver's: the Desert Eagle's with a lighter floor (POLISHED_STAINLESS.dark), which keeps its frame's lower
 * half and its barrel's underside closer to the photo's pale steel. Same horizon, bands and edges.
 */
export const REVOLVER_POLISH: Polish = {
  ...CHROME_STAINLESS,
  floor: "#6c7178",
  floorLow: "#a7acb3",
};

/** Gradient stops, as [offset, color] */
export type Stops = readonly (readonly [number, string])[];

/** A flat face's bands, top to bottom */
export function faceStops(p: Polish): Stops {
  return [
    [0, p.sky],
    [p.horizon, p.skyLow],
    [Math.min(1, p.horizon + p.hardness), p.floor],
    [1, p.floorLow],
  ];
}

/** A horizontal cylinder's bands, top to bottom: a streak of sky near its top, the floor below its middle */
export function roundStops(p: Polish): Stops {
  return [
    [0, p.floorLow],
    [0.1, p.edge],
    [0.22, p.sky],
    [0.48, p.skyLow],
    [0.48 + p.hardness, p.floor],
    [0.82, p.floorLow],
    [1, p.floor],
  ];
}

/** A face turned up toward the sky (a top bevel): bright, a little darker at its far edge */
export function upStops(p: Polish): Stops {
  return [
    [0, p.edge],
    [0.4, p.sky],
    [1, p.skyLow],
  ];
}

/** A groove along a cylinder (a flute), across it: concave, so it reflects the other way up, floor above sky */
export function grooveStops(p: Polish): Stops {
  return [
    [0, p.floor],
    [0.42, p.floorLow],
    [0.42 + p.hardness, p.sky],
    [0.75, p.edge],
    [1, p.skyLow],
  ];
}

/** A linear gradient from one point to another, in the drawing's units */
export function linear(
  id: string,
  from: Point,
  to: Point,
  stops: Stops,
): string {
  return [
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fixed(from[0], 1)}" y1="${fixed(from[1], 1)}" x2="${fixed(to[0], 1)}" y2="${fixed(to[1], 1)}">`,
    ...stops.map(
      ([o, c]) => `      <stop offset="${fixed(o, 3)}" stop-color="${c}"/>`,
    ),
    "    </linearGradient>",
  ].join("\n");
}

/** A gradient over each shape's own box, top to bottom */
export function boxGradient(id: string, stops: Stops): string {
  return [
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">`,
    ...stops.map(
      ([o, c]) => `      <stop offset="${fixed(o, 3)}" stop-color="${c}"/>`,
    ),
    "    </linearGradient>",
  ].join("\n");
}

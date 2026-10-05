import {
  DEFAULT_LOOK,
  EXTRA_KINDS,
  EYE_COLORS,
  GLASSES_SHAPES,
  Hair,
  HAIR_CUTS,
  HairCut,
  HAIRLINES,
  HAT_STYLES,
  PANTS_STYLES,
  PATTERN_KINDS,
  SHOE_STYLES,
  Hat,
  HatStyle,
  TOP_STYLES,
  TopStyle,
} from "../../highrise/looks/BodyLook";
import { HAIR_COLORS, SKIN_TONES } from "../../highrise/looks/randomLook";
import { Option, Preset } from "./controls";

/*
 * What the Appearance tab calls each of a look's options, and what it says
 * about them: the look's own names are ids ("hightops", "tshirt").
 */

/** Options in the order of `values`, named by `labels` (else capitalized) */
function options<T extends string>(
  values: readonly T[],
  labels: Partial<Record<T, string | [string, string]>> = {},
): Option<T>[] {
  return values.map((value) => {
    const entry = labels[value];
    const [label, about] = Array.isArray(entry)
      ? entry
      : [entry ?? capitalize(value), undefined];
    return { value, label, tip: about };
  });
}

export function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

export const TOP_OPTIONS = options(TOP_STYLES, {
  tshirt: "T-shirt",
  polo: ["Polo", "A polo shirt, with a collar and buttons at the neck"],
  shirt: ["Shirt", "A shirt with a collar, buttoned down the front"],
  tank: ["Tank top", "Bare shoulders"],
  jacket: ["Jacket", "Open down the front over a shirt, the second color"],
  coat: ["Coat", "With its collar and lining the second color"],
  vest: ["Vest", "Over a shirt, the second color, which is the sleeves too"],
  overalls: [
    "Overalls",
    "Over a shirt, the second color, which is the sleeves too",
  ],
  tracksuit: [
    "Track suit",
    "Zipped up, with stripes (the second color) over the shoulders and down the sleeves. Goes with track pants",
  ],
});

/** What a top's second color is, if it has one */
export const TOP_SECONDARY: Partial<Record<TopStyle, [string, string]>> = {
  jacket: ["Shirt under", "The shirt under the jacket"],
  vest: ["Shirt under", "The shirt under the vest, and its sleeves"],
  overalls: ["Shirt under", "The shirt under the overalls, and its sleeves"],
  coat: ["Collar, lining", "The coat's collar and its lining"],
  tracksuit: ["Stripes", "The stripes over the shoulders and down the sleeves"],
};

/** Tops whose collar can be popped */
export const COLLARED: TopStyle[] = [
  "polo",
  "shirt",
  "jacket",
  "coat",
  "tracksuit",
];

export const PATTERN_OPTIONS = [
  { value: "", label: "Plain" },
  ...options(PATTERN_KINDS),
] as Option<"" | (typeof PATTERN_KINDS)[number]>[];

export const PANTS_OPTIONS = options(PANTS_STYLES, {
  trackpants: ["Track pants", "With stripes down the sides"],
});

export const SHOE_OPTIONS = options(SHOE_STYLES, {
  hightops: ["High-tops", "Sneakers up over the ankle"],
  runners: ["Runners", "Running shoes, with a swoosh"],
  dress: "Dress shoes",
  bare: "Bare feet",
});

/** Shoes with a sole (and stripes) of their own color */
export const SNEAKERS = ["sneakers", "hightops", "runners"];

export const HAT_OPTIONS = [
  { value: "", label: "None" },
  ...options(HAT_STYLES, {
    hardhat: "Hard hat",
    santa: "Santa",
    cowboy: "Cowboy",
  }),
] as Option<"" | (typeof HAT_STYLES)[number]>[];

/** Each hat in its usual colors, until it's given its own */
export const HAT_DEFAULTS: Record<HatStyle, Omit<Hat, "style">> = {
  cap: { color: "#2f4672" },
  beanie: { color: "#6b3434" },
  hardhat: { color: "#e3b425" },
  santa: { color: "#c8141c", secondary: "#f4f1ea" },
  cowboy: { color: "#ae7b4f" },
  tricorn: { color: "#262626", secondary: "#656565" },
  bandana: { color: "#a52a2a" },
  beret: { color: "#2a2a30" },
};

/**
 * A hat of `style` (or none): in the colors the one before had if they were
 * its own, else that style's usual ones
 */
export function withHat(
  hat: Hat | undefined,
  style: HatStyle | "",
): Hat | undefined {
  if (!style) {
    return undefined;
  }
  const custom =
    hat &&
    (hat.color !== HAT_DEFAULTS[hat.style].color ||
      hat.secondary !== HAT_DEFAULTS[hat.style].secondary);
  return custom ? { ...hat, style } : { style, ...HAT_DEFAULTS[style] };
}

export const GLASSES_OPTIONS = [
  { value: "", label: "None" },
  ...options(GLASSES_SHAPES, { shades: "Sunglasses" }),
] as Option<"" | (typeof GLASSES_SHAPES)[number]>[];

export const HAIRLINE_OPTIONS = options(HAIRLINES, {
  natural: [
    "Natural",
    "Curves round the forehead, back at the temples and forward to the sideburns",
  ],
  straight: ["Straight", "Bangs cut straight across"],
  peak: ["Widow's peak", "Coming to a point in the middle"],
  receding: ["Receding", "Far back at the temples"],
  swept: [
    "Swept",
    "A fringe swept across to one side: the parting's side, else the left",
  ],
  curtains: ["Curtains", "Parted in the middle and swept out to both sides"],
});

/**
 * What the hair is, as the cut picker has it: grown, cut right down, or
 * none (bald, which in the look is no coverage)
 */
export type CutChoice = "" | HairCut | "bald";

export const CUT_OPTIONS: Option<CutChoice>[] = [
  {
    value: "",
    label: "As grown",
    tip: "Its length, volume, curls and how it's tied are below",
  },
  ...options(HAIR_CUTS, {
    buzz: ["Buzz cut", "Clipped right down, the color showing over the scalp"],
    stubble: ["Stubble", "Shaved, and growing back: just a shadow"],
  }),
  { value: "bald", label: "Bald" },
];

export function cutOf(hair: Hair): CutChoice {
  return hair.coverage <= 0 ? "bald" : (hair.cut ?? "");
}

/** `hair` cut as `choice`; hair grown back on a bald head is the usual amount */
export function withCut(hair: Hair, choice: CutChoice): Hair {
  if (choice === "bald") {
    return { ...hair, coverage: 0, cut: undefined };
  }
  return {
    ...hair,
    cut: choice || undefined,
    coverage: hair.coverage > 0 ? hair.coverage : DEFAULT_LOOK.hair.coverage,
  };
}

export const EXTRA_OPTIONS = options(EXTRA_KINDS, {
  sack: ["Sack", "Slung over the back"],
  lanyard: ["Lanyard", "An ID badge on a cord round the neck"],
});

export const SKIN_PRESETS: Preset[] = SKIN_TONES.map((color) => ({ color }));

const HAIR_NAMES = [
  "Black",
  "Darkest brown",
  "Dark brown",
  "Brown",
  "Light brown",
  "Caramel",
  "Dark blond",
  "Blond",
  "Red",
  "Ginger",
  "Grey",
  "White",
];
export const HAIR_PRESETS: Preset[] = HAIR_COLORS.map((color, i) => ({
  color,
  name: HAIR_NAMES[i],
}));

export const EYE_PRESETS: Preset[] = Object.entries(EYE_COLORS).map(
  ([name, color]) => ({ color, name: capitalize(name) }),
);

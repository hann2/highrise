import { Color, isColor } from "./color";

/**
 * What a body looks like, as data: everything the generator (`drawBody`)
 * needs to draw its parts. Characters keep theirs in their JSON (`look`),
 * zombies get random ones (`randomLook.ts`). Numbers are sliders: build
 * sliders go from -1 to 1 with 0 average, the rest from 0 to 1 unless they
 * say otherwise. Anything left out is the default (`resolveLook`).
 */
export interface BodyLook {
  skin: Color;
  build: Build;
  hair: Hair;
  /** No beard if left out */
  beard?: Beard;
  top: Top;
  sleeves: Sleeves;
  /** Bare hands if left out */
  gloves?: Color;
  hat?: Hat;
  glasses?: Glasses;
  /** Things worn or carried on top of the clothes */
  extras: Extra[];
  /** Hand-drawn pieces worn on the head or torso (`pieces.ts`) */
  pieces?: PieceUse[];
  /** The trousers and shoes, which the leg images are tinted with */
  pants: Color;
  shoes: Color;
  /** How far gone they are, for zombies */
  zombie?: Zombification;
  /** For the random parts: ragged edges, where tears and blood go */
  seed: number;
}

/** Each from -1 to 1, 0 being average */
export interface Build {
  /** How broad the shoulders are */
  shoulders: number;
  /** How far the chest comes forward */
  chest: number;
  /** A belly out in front, from flat (-1 and 0) to big (1) */
  belly: number;
  /** Shoulders rolled forward */
  hunch: number;
  /** From round shoulders to square ones */
  squareness: number;
  /** Thickness of the arms */
  arms: number;
  hands: number;
  head: number;
}

export interface Hair {
  color: Color;
  /** How far forward the hair comes: 0 is bald, 1 covers the forehead */
  coverage: number;
  /** How much it stands out from the head */
  volume: number;
  /** How uneven its edge is */
  messiness: number;
  /** Tight bumps round the edge, up to an afro */
  curls: number;
  /** How far it hangs down the back */
  length: number;
  /** The hairline's shape: -1 comes forward in the middle (bangs, a widow's peak), 1 recedes in the middle */
  fringe: number;
  /** Where it's parted, from -1 (the left) to 1, if it is */
  part?: number;
  /** A bun on the back of the head, this big */
  bun: number;
  /** A ponytail down the back, this long */
  ponytail: number;
  /** Shaved but for a strip down the middle this wide, if more than 0 */
  mohawk: number;
}

export interface Beard {
  /** Its own color, else the hair's */
  color?: Color;
  /** How far it sticks out in front */
  length: number;
}

export const TOP_STYLES = [
  "tshirt",
  "shirt",
  "tank",
  "jacket",
  "coat",
  "hoodie",
  "sweater",
  "vest",
  "overalls",
] as const;
export type TopStyle = (typeof TOP_STYLES)[number];

/**
 * What they wear on top. `color` is the main garment; `secondary` is what
 * else shows: the shirt under a jacket, vest or overalls, a coat's trim.
 */
export interface Top {
  style: TopStyle;
  color: Color;
  secondary: Color;
  pattern?: Pattern;
}

export const PATTERN_KINDS = ["stripes", "plaid", "dots"] as const;
export interface Pattern {
  kind: (typeof PATTERN_KINDS)[number];
  color: Color;
}

export interface Sleeves {
  /** From none (0) to the wrist (1) */
  length: number;
  /** Else the top's color, or the secondary's if the top has no sleeves of its own */
  color?: Color;
  /** A band at the end of the sleeve */
  cuff?: Color;
}

export const HAT_STYLES = [
  "cap",
  "beanie",
  "hardhat",
  "santa",
  "cowboy",
  "tricorn",
  "bandana",
  "beret",
] as const;
export interface Hat {
  style: (typeof HAT_STYLES)[number];
  color: Color;
  /** Trim, a band, a badge */
  secondary?: Color;
}

export const GLASSES_SHAPES = ["round", "square", "shades"] as const;
export interface Glasses {
  shape: (typeof GLASSES_SHAPES)[number];
  color: Color;
}

export const EXTRA_KINDS = [
  "backpack",
  "satchel",
  "scarf",
  "tie",
  "sack",
  "lanyard",
] as const;
export interface Extra {
  kind: (typeof EXTRA_KINDS)[number];
  color: Color;
}

export interface PieceUse {
  /** Its file's name, without `.svg` */
  name: string;
  /** What its magenta becomes */
  color: Color;
  /** What its cyan becomes, else `color` */
  secondary?: Color;
}

export interface Zombification {
  /** From fresh to rotten: greener, greyer, blotchier skin, thinner hair */
  rot: number;
  blood: number;
  /** Rips in the clothes */
  tears: number;
}

export const DEFAULT_LOOK: BodyLook = {
  skin: "#e0b48f",
  build: {
    shoulders: 0,
    chest: 0,
    belly: 0,
    hunch: 0,
    squareness: 0,
    arms: 0,
    hands: 0,
    head: 0,
  },
  hair: {
    color: "#3b2a1e",
    coverage: 0.75,
    volume: 0.2,
    messiness: 0.2,
    curls: 0,
    length: 0,
    fringe: 0.2,
    bun: 0,
    ponytail: 0,
    mohawk: 0,
  },
  top: { style: "tshirt", color: "#6b7c8f", secondary: "#e8e4dc" },
  sleeves: { length: 0.35 },
  extras: [],
  pants: "#3e4552",
  shoes: "#262626",
  seed: 1,
};

/** A look as it may be stored: anything can be left out */
export type PartialLook = Partial<
  Omit<BodyLook, "build" | "hair" | "top" | "sleeves">
> & {
  build?: Partial<Build>;
  hair?: Partial<Hair>;
  top?: Partial<Top>;
  sleeves?: Partial<Sleeves>;
};

/** `look` with the defaults filled in */
export function resolveLook(look: PartialLook | undefined): BodyLook {
  const l = look ?? {};
  return {
    ...DEFAULT_LOOK,
    ...l,
    build: { ...DEFAULT_LOOK.build, ...l.build },
    hair: { ...DEFAULT_LOOK.hair, ...l.hair },
    top: { ...DEFAULT_LOOK.top, ...l.top },
    sleeves: { ...DEFAULT_LOOK.sleeves, ...l.sleeves },
    extras: l.extras ?? [],
  };
}

/** Everything wrong with a stored look, or nothing */
export function lookProblems(look: PartialLook | undefined): string[] {
  const problems: string[] = [];
  if (look === undefined) {
    return problems;
  }
  const r = resolveLook(look);
  const color = (name: string, value: unknown) => {
    if (value !== undefined && !isColor(value)) {
      problems.push(`look ${name} "${value}" isn't a color like #3e4552`);
    }
  };
  const range = (name: string, value: unknown, min: number, max: number) => {
    if (typeof value !== "number" || !(value >= min && value <= max)) {
      problems.push(`look ${name} ${value} isn't from ${min} to ${max}`);
    }
  };
  const oneOf = (name: string, value: unknown, options: readonly string[]) => {
    if (!options.includes(value as string)) {
      problems.push(
        `look ${name} "${value}" isn't one of ${options.join(", ")}`,
      );
    }
  };

  color("skin", r.skin);
  color("pants", r.pants);
  color("shoes", r.shoes);
  color("gloves", r.gloves);
  for (const [key, value] of Object.entries(r.build)) {
    range(`build.${key}`, value, -1, 1);
  }
  color("hair.color", r.hair.color);
  for (const key of [
    "coverage",
    "volume",
    "messiness",
    "curls",
    "length",
    "bun",
    "ponytail",
    "mohawk",
  ] as const) {
    range(`hair.${key}`, r.hair[key], 0, 1);
  }
  range("hair.fringe", r.hair.fringe, -1, 1);
  if (r.hair.part !== undefined) {
    range("hair.part", r.hair.part, -1, 1);
  }
  if (r.beard) {
    color("beard.color", r.beard.color);
    range("beard.length", r.beard.length, 0, 1);
  }
  oneOf("top.style", r.top.style, TOP_STYLES);
  color("top.color", r.top.color);
  color("top.secondary", r.top.secondary);
  if (r.top.pattern) {
    oneOf("top.pattern.kind", r.top.pattern.kind, PATTERN_KINDS);
    color("top.pattern.color", r.top.pattern.color);
  }
  range("sleeves.length", r.sleeves.length, 0, 1);
  color("sleeves.color", r.sleeves.color);
  color("sleeves.cuff", r.sleeves.cuff);
  if (r.hat) {
    oneOf("hat.style", r.hat.style, HAT_STYLES);
    color("hat.color", r.hat.color);
    color("hat.secondary", r.hat.secondary);
  }
  if (r.glasses) {
    oneOf("glasses.shape", r.glasses.shape, GLASSES_SHAPES);
    color("glasses.color", r.glasses.color);
  }
  for (const extra of r.extras) {
    oneOf("extra", extra.kind, EXTRA_KINDS);
    color(`${extra.kind}.color`, extra.color);
  }
  for (const piece of r.pieces ?? []) {
    if (typeof piece.name !== "string" || !piece.name) {
      problems.push(`look piece "${piece.name}" has no name`);
    }
    color(`piece ${piece.name} color`, piece.color);
    color(`piece ${piece.name} secondary`, piece.secondary);
  }
  if (r.zombie) {
    range("zombie.rot", r.zombie.rot, 0, 1);
    range("zombie.blood", r.zombie.blood, 0, 1);
    range("zombie.tears", r.zombie.tears, 0, 1);
  }
  if (!Number.isInteger(r.seed)) {
    problems.push(`look seed ${r.seed} isn't a whole number`);
  }
  return problems;
}

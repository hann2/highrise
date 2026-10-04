import { BodyLook, Extra, Hat, TopStyle } from "./BodyLook";
import { Color, darken, mix } from "./color";

/** Random looks, for zombies (and anyone else who isn't a character) */

export const SKIN_TONES: Color[] = [
  "#f3d2b8",
  "#ecc3a2",
  "#e0b48f",
  "#d39f78",
  "#c08561",
  "#a66c48",
  "#8a5536",
  "#6e4129",
  "#53301e",
];

export const HAIR_COLORS: Color[] = [
  "#16120f",
  "#2a1d15",
  "#3b2a1e",
  "#5a3a22",
  "#7a4e2c",
  "#9c6a3a",
  "#c49a62",
  "#dcc28e",
  "#8a1f12",
  "#a8471f",
  "#8f8f8f",
  "#cfcfcf",
];

/** What people wear to work in an office building */
const SHIRT_COLORS: Color[] = [
  "#ecebe6",
  "#dfe6ee",
  "#a9c3dc",
  "#c4d6e8",
  "#e6c9cd",
  "#d9d2be",
  "#b7c4a8",
];
const CASUAL_COLORS: Color[] = [
  "#8b9096",
  "#2f3b56",
  "#26272b",
  "#45484f",
  "#cbb894",
  "#6b6e4a",
  "#6e2a33",
  "#2f5440",
  "#2f6b6b",
  "#c49a3a",
  "#9c8cc0",
  "#a83232",
  "#c8692f",
  "#4f6fa8",
  "#d6d0c4",
  "#7d4f8f",
];
const SUIT_COLORS: Color[] = [
  "#2b2f3a",
  "#3a3d45",
  "#22262f",
  "#4a4136",
  "#5a5f68",
  "#2d3a4f",
];
const TIE_COLORS: Color[] = [
  "#7a1f2b",
  "#1f3a7a",
  "#2b5a3a",
  "#5a2b6e",
  "#8a6a1f",
  "#3a3a3a",
];
const PANTS_COLORS: Color[] = [
  "#2a3044",
  "#26272b",
  "#45484f",
  "#b9a57a",
  "#3d5470",
  "#4d5f80",
  "#5a4632",
  "#6b6452",
];
const SHOE_COLORS: Color[] = [
  "#1f1f22",
  "#2a2420",
  "#4a3424",
  "#6b5a48",
  "#d8d8d4",
  "#3a3a3e",
];

type Random = () => number;

function pick<T>(random: Random, options: readonly T[]): T {
  return options[Math.floor(random() * options.length)];
}

function between(random: Random, min: number, max: number) {
  return min + random() * (max - min);
}

/** Roughly normal, from -1 to 1 */
function slider(random: Random, spread = 0.45): number {
  const value = (random() + random() + random() - 1.5) * spread * 1.6;
  return Math.max(-1, Math.min(1, Math.round(value * 100) / 100));
}

function chance(random: Random, p: number) {
  return random() < p;
}

interface Outfit {
  style: TopStyle;
  color: Color;
  secondary: Color;
  sleeves: number;
  extras: Extra[];
  hat?: Hat;
  pattern?: BodyLook["top"]["pattern"];
  pants?: Color;
}

/** What they're wearing, by who they were */
const OUTFITS: { weight: number; make: (random: Random) => Outfit }[] = [
  {
    // Shirt and tie
    weight: 5,
    make: (random) => ({
      style: "shirt",
      color: pick(random, SHIRT_COLORS),
      secondary: "#ffffff",
      sleeves: chance(random, 0.7) ? 1 : 0.4,
      extras: [
        ...(chance(random, 0.5)
          ? [{ kind: "tie" as const, color: pick(random, TIE_COLORS) }]
          : []),
        ...(chance(random, 0.35)
          ? [
              {
                kind: "lanyard" as const,
                color: pick(random, ["#2a5aa8", "#b02a2a", "#2a2a2a"]),
              },
            ]
          : []),
      ],
      pattern: chance(random, 0.15)
        ? { kind: "stripes", color: darken(pick(random, SHIRT_COLORS), 0.15) }
        : undefined,
    }),
  },
  {
    // A suit
    weight: 3,
    make: (random) => {
      const suit = pick(random, SUIT_COLORS);
      return {
        style: "jacket",
        color: suit,
        secondary: pick(random, SHIRT_COLORS),
        sleeves: 1,
        extras: chance(random, 0.6)
          ? [{ kind: "tie", color: pick(random, TIE_COLORS) }]
          : [],
        pants: suit,
      };
    },
  },
  {
    // Casual
    weight: 5,
    make: (random) => ({
      style: pick(random, ["tshirt", "tshirt", "sweater", "hoodie"] as const),
      color: pick(random, CASUAL_COLORS),
      secondary: pick(random, CASUAL_COLORS),
      sleeves: between(random, 0.3, 1),
      extras: [
        ...(chance(random, 0.15)
          ? [{ kind: "backpack" as const, color: pick(random, CASUAL_COLORS) }]
          : []),
        ...(chance(random, 0.06)
          ? [{ kind: "scarf" as const, color: pick(random, CASUAL_COLORS) }]
          : []),
      ],
      hat: chance(random, 0.12)
        ? {
            style: pick(random, ["cap", "beanie"] as const),
            color: pick(random, CASUAL_COLORS),
            secondary: chance(random, 0.5)
              ? pick(random, CASUAL_COLORS)
              : undefined,
          }
        : undefined,
      pattern: chance(random, 0.12)
        ? {
            kind: pick(random, ["stripes", "plaid", "dots"] as const),
            color: pick(random, CASUAL_COLORS),
          }
        : undefined,
    }),
  },
  {
    // Cardigan or blazer over a blouse
    weight: 2,
    make: (random) => ({
      style: "jacket",
      color: pick(random, CASUAL_COLORS),
      secondary: pick(random, SHIRT_COLORS),
      sleeves: between(random, 0.6, 1),
      extras: chance(random, 0.25)
        ? [
            {
              kind: "satchel",
              color: pick(random, ["#6b4428", "#2a2420", "#8a5a32"]),
            },
          ]
        : [],
    }),
  },
  {
    // Janitor
    weight: 1,
    make: (random) => {
      const color = pick(random, ["#4a5f78", "#5c6450", "#3f4f63"]);
      return {
        style: "overalls",
        color,
        secondary: pick(random, ["#8b9096", "#d6d0c4", "#a9c3dc"]),
        sleeves: between(random, 0.3, 0.7),
        extras: [],
        pants: color,
      };
    },
  },
  {
    // Security guard
    weight: 1,
    make: (random) => ({
      style: "shirt",
      color: pick(random, ["#26272b", "#2a3044", "#5a6170"]),
      secondary: "#ffffff",
      sleeves: 0.4,
      extras: [{ kind: "lanyard", color: "#2a2a2a" }],
      hat: chance(random, 0.4) ? { style: "cap", color: "#22252c" } : undefined,
      pants: "#26272b",
    }),
  },
  {
    // Builder
    weight: 1,
    make: (random) => ({
      style: "vest",
      color: pick(random, ["#e8752a", "#c8e03a"]),
      secondary: pick(random, CASUAL_COLORS),
      sleeves: 0.35,
      extras: [],
      hat: chance(random, 0.7)
        ? {
            style: "hardhat",
            color: pick(random, ["#e8c22a", "#f0f0ec", "#e8752a"]),
          }
        : undefined,
      pants: pick(random, ["#3d5470", "#b9a57a"]),
    }),
  },
  {
    // Lab coat or chef's whites
    weight: 1,
    make: (random) => ({
      style: "coat",
      color: "#eeeeea",
      secondary: "#e2e2dc",
      sleeves: 1,
      extras: [],
    }),
  },
  {
    // Gym
    weight: 1,
    make: (random) => ({
      style: "tank",
      color: pick(random, CASUAL_COLORS),
      secondary: "#ffffff",
      sleeves: 0,
      extras: [],
      hat: chance(random, 0.2)
        ? {
            style: "bandana",
            color: pick(random, CASUAL_COLORS),
            secondary: "#ffffff",
          }
        : undefined,
    }),
  },
];

function pickOutfit(random: Random): Outfit {
  const total = OUTFITS.reduce((sum, o) => sum + o.weight, 0);
  let roll = random() * total;
  for (const outfit of OUTFITS) {
    roll -= outfit.weight;
    if (roll <= 0) {
      return outfit.make(random);
    }
  }
  return OUTFITS[0].make(random);
}

/** Someone who works (worked) in the building */
export function randomLook(random: Random, zombie: boolean): BodyLook {
  const outfit = pickOutfit(random);
  const hairColor = pick(random, HAIR_COLORS);
  const bald = chance(random, 0.1);
  const long = chance(random, 0.3);
  const look: BodyLook = {
    skin: mix(
      pick(random, SKIN_TONES),
      pick(random, SKIN_TONES),
      random() * 0.3,
    ),
    build: {
      shoulders: slider(random),
      chest: slider(random),
      belly: chance(random, 0.3)
        ? Math.round(random() * 100) / 100
        : slider(random, 0.2),
      hunch: zombie
        ? Math.round(between(random, 0, 1) * 100) / 100
        : slider(random, 0.3),
      squareness: slider(random),
      arms: slider(random),
      hands: slider(random, 0.3),
      head: slider(random, 0.3),
    },
    hair: {
      color: hairColor,
      coverage: bald ? 0 : Math.round(between(random, 0.55, 1) * 100) / 100,
      volume: Math.round(between(random, 0, long ? 0.6 : 0.4) * 100) / 100,
      messiness:
        Math.round(between(random, zombie ? 0.3 : 0, zombie ? 1 : 0.5) * 100) /
        100,
      curls: chance(random, 0.15)
        ? Math.round(between(random, 0.3, 1) * 100) / 100
        : 0,
      length: long ? Math.round(between(random, 0.2, 1) * 100) / 100 : 0,
      fringe: slider(random, 0.6),
      part: chance(random, 0.3) ? slider(random, 0.8) : undefined,
      bun:
        !long && chance(random, 0.08)
          ? Math.round(between(random, 0.3, 1) * 100) / 100
          : 0,
      ponytail:
        long && chance(random, 0.3)
          ? Math.round(between(random, 0.3, 1) * 100) / 100
          : 0,
      mohawk: chance(random, 0.02) ? 0.3 : 0,
    },
    beard: chance(random, 0.2)
      ? { length: Math.round(between(random, 0, 0.7) * 100) / 100 }
      : undefined,
    top: {
      style: outfit.style,
      color: outfit.color,
      secondary: outfit.secondary,
      pattern: outfit.pattern,
    },
    sleeves: { length: Math.round(outfit.sleeves * 100) / 100 },
    hat: outfit.hat,
    glasses: chance(random, 0.15)
      ? {
          shape: pick(random, ["round", "square", "square", "shades"] as const),
          color: pick(random, ["#1a1a1a", "#5a3a22", "#8a8a8a", "#2a3a6a"]),
        }
      : undefined,
    extras: outfit.extras,
    pants: outfit.pants ?? pick(random, PANTS_COLORS),
    shoes: pick(random, SHOE_COLORS),
    seed: Math.floor(random() * 1e6),
  };
  if (zombie) {
    look.zombie = {
      rot: Math.round(between(random, 0.45, 1) * 100) / 100,
      blood: Math.round(between(random, 0.2, 1) * 100) / 100,
      tears: Math.round(between(random, 0.1, 1) * 100) / 100,
    };
    // Clothes that have been through it
    look.top.color = darken(look.top.color, random() * 0.15);
    look.pants = darken(look.pants, random() * 0.15);
  }
  return look;
}

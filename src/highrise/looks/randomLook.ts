import {
  BodyLook,
  DEFAULT_LOOK,
  EYE_COLORS,
  Extra,
  Hat,
  PantsStyle,
  ShoeStyle,
  TopStyle,
} from "./BodyLook";
import { Color, darken, luminance, mix } from "./color";
import { lookRandom } from "./dimensions";

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
  pantsStyle?: PantsStyle;
  shoeStyle?: ShoeStyle;
}

/** Soles and stripes of sneakers that aren't plain white */
const SHOE_TRIMS: Color[] = [
  "#1a1a1a",
  "#d8403a",
  "#e8c040",
  "#3a7ad8",
  "#f2efe6",
];

const DENIM: Color[] = ["#3d5470", "#4d5f80", "#2e3d58", "#6a7f9e", "#26272b"];

/** What's on their legs and feet, if their outfit doesn't say */
function pickLegwear(random: Random, outfit: Outfit): [PantsStyle, ShoeStyle] {
  const office = ["shirt", "jacket", "coat"].includes(outfit.style);
  const pants: PantsStyle =
    outfit.pantsStyle ??
    (office
      ? weighted(random, { trousers: 6, skirt: 3, jeans: 1 })
      : weighted(random, { jeans: 5, trousers: 2, shorts: 1.5, skirt: 1.5 }));
  const shoes: ShoeStyle =
    outfit.shoeStyle ??
    (pants === "skirt"
      ? weighted(random, { heels: 4, dress: 2, sneakers: 2, sandals: 1 })
      : office
        ? weighted(random, { dress: 5, sneakers: 2, boots: 1 })
        : weighted(random, { sneakers: 6, boots: 2, sandals: 1, dress: 1 }));
  return [pants, shoes];
}

function weighted<T extends string>(
  random: Random,
  weights: Partial<Record<T, number>>,
): T {
  const entries = Object.entries(weights) as [T, number][];
  let roll = random() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [option, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return option;
    }
  }
  return entries[0][0];
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
        pantsStyle: "trousers",
        shoeStyle: "dress",
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
        pantsStyle: "trousers",
        shoeStyle: chance(random, 0.6) ? "boots" : "sneakers",
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
      pantsStyle: "trousers",
      shoeStyle: chance(random, 0.5) ? "boots" : "dress",
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
      pantsStyle: chance(random, 0.6) ? "jeans" : "trousers",
      shoeStyle: "boots",
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
      pantsStyle: chance(random, 0.7) ? "shorts" : "trousers",
      shoeStyle: "sneakers",
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
  const [pantsStyle, shoeStyle] = pickLegwear(random, outfit);
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
      bust: 0,
      hunch: zombie
        ? Math.round(between(random, 0, 1) * 100) / 100
        : slider(random, 0.3),
      squareness: slider(random),
      arms: slider(random),
      hands: slider(random, 0.3),
      feet: 0,
      head: slider(random, 0.3),
      legs: slider(random, 0.4),
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
      hairline: "natural",
      fringe: slider(random, 0.6),
      balding: 0,
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
    brows: DEFAULT_LOOK.brows,
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
    pantsStyle,
    pants:
      outfit.pants ??
      pick(random, pantsStyle === "jeans" ? DENIM : PANTS_COLORS),
    // Zombies lose their shoes
    shoeStyle: zombie && chance(random, 0.12) ? "bare" : shoeStyle,
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
  // Drawn last, so adding them didn't change everything drawn before them
  // (the zombies' looks come from a fixed seed)
  look.brows = {
    bushiness:
      Math.round(between(random, 0.1, look.beard ? 0.9 : 0.7) * 100) / 100,
    arch: Math.round(random() * 100) / 100,
    tilt: Math.round(slider(random, 0.25) * 100) / 100,
  };
  const bustChance = look.beard ? 0 : pantsStyle === "skirt" ? 0.9 : 0.4;
  if (chance(random, bustChance)) {
    look.build.bust = Math.round(between(random, 0.25, 0.85) * 100) / 100;
  }
  // Hairlines, haircuts and thinning on top
  look.hair.hairline = weighted(random, {
    natural: 8,
    straight: 2,
    peak: 1,
    receding: look.beard ? 3 : 1,
    swept: 2,
    curtains: 1,
  });
  if (look.hair.coverage > 0 && !look.hair.length && chance(random, 0.12)) {
    look.hair.cut = chance(random, 0.6) ? "buzz" : "stubble";
  }
  if (look.hair.coverage > 0 && look.build.bust === 0 && chance(random, 0.18)) {
    look.hair.balding = Math.round(between(random, 0.2, 1) * 100) / 100;
  }
  look.build.feet =
    Math.round((look.build.hands * 0.5 + slider(random, 0.3)) * 100) / 100;
  if (look.shoeStyle === "sneakers") {
    look.shoeStyle = weighted(random, { sneakers: 5, hightops: 2, runners: 3 });
    if (chance(random, 0.35)) {
      look.shoeTrim = pick(random, SHOE_TRIMS);
    }
  }
  if (look.pantsStyle === "shorts" || look.pantsStyle === "skirt") {
    look.pantsLength =
      Math.round(
        (look.pantsStyle === "shorts"
          ? between(random, 0.3, 0.6)
          : between(random, 0.3, 0.85)) * 100,
      ) / 100;
  }
  // Mostly brown; the lighter colors are commoner with lighter skin. From
  // the look's own seed, so the looks made after this one don't change
  const fair = luminance(look.skin) > 0.62;
  look.eyes =
    EYE_COLORS[
      weighted<keyof typeof EYE_COLORS>(lookRandom(look, 31), {
        brown: 6,
        "dark brown": 3,
        hazel: fair ? 2 : 1,
        amber: 1,
        green: fair ? 2 : 0.3,
        grey: fair ? 1 : 0.2,
        blue: fair ? 4 : 0.3,
      })
    ];
  // The odd one with short hair spiked up at the front, also from the look's
  // own seed
  const spiky = lookRandom(look, 37);
  const hair = look.hair;
  if (
    hair.coverage > 0.4 &&
    !hair.cut &&
    hair.length < 0.2 &&
    !hair.ponytail &&
    !hair.bun &&
    spiky() < 0.12
  ) {
    hair.hairline = "spiky";
    hair.volume = Math.max(
      hair.volume,
      Math.round(between(spiky, 0.3, 0.8) * 100) / 100,
    );
  }
  // The odd one in a track suit
  if (
    ["tshirt", "hoodie", "sweater"].includes(look.top.style) &&
    chance(random, 0.06)
  ) {
    look.top.style = "tracksuit";
    look.top.secondary = pick(random, [
      "#f2f2ee",
      "#f2f2ee",
      "#1a1a1a",
      "#e8c040",
    ]);
    look.top.pattern = undefined;
    look.sleeves = { length: 1 };
    look.pantsStyle = "trackpants";
    look.pants = look.top.color;
    look.pantsTrim = look.top.secondary;
    look.pantsLength = undefined;
  }
  return look;
}

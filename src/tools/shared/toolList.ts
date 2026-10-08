/*
 * Everything there is to look at in development, so the tools can link to
 * each other: the tools' own pages, and the game's test scenes (`?scene=`,
 * see `highrise/main.ts`). Add a tool or a scene here and it's in every
 * tool's nav bar and on the tools page (/tools/).
 */

export interface ToolLink {
  readonly name: string;
  readonly href: string;
  /** One line on what it's for */
  readonly about: string;
}

/** The tools' own pages */
export const TOOLS: readonly ToolLink[] = [
  {
    name: "Character Editor",
    href: "/tools/character-editor/",
    about:
      "Each character's look, starting weapons, stats and voice clips, with the game as the preview",
  },
  {
    name: "Gun Browser",
    href: "/tools/gun-browser/",
    about:
      "Every gun's art at true scale, its points and moving parts, its animations in someone's hands, and its stats",
  },
];

/** The game, and its test scenes (development only) */
export const SCENES: readonly ToolLink[] = [
  { name: "The game", href: "/", about: "From the title screen" },
  {
    name: "Play a run",
    href: "/?play",
    about: "Skips the title and the lobby (play=chad picks who, floor=5 where)",
  },
  {
    name: "Arena",
    href: "/?scene=arena",
    about: "Characters and loadouts against waves of enemies (Tab: setup)",
  },
  {
    name: "Rig",
    href: "/?scene=rig",
    about:
      "A lineup of guns firing and reloading (M: animation, G: points, Space: pause)",
  },
  {
    name: "Muzzle flashes",
    href: "/?scene=flash",
    about: "Every gun's flash in the dark (gallery holds them still)",
  },
  {
    name: "Walking",
    href: "/?scene=walk",
    about: "Lanes of bodies walking every way (P: footprints)",
  },
  {
    name: "Dangles",
    href: "/?scene=dangles",
    about: "Everything that swings, walking, turning and stopping",
  },
  {
    name: "Looks",
    href: "/?scene=looks",
    about: "Every body the generator draws, in a grid",
  },
  {
    name: "Deaths",
    href: "/?scene=deaths",
    about: "A lineup of zombies killed each way",
  },
  {
    name: "Fire",
    href: "/?scene=fire",
    about: "A test room for fire and smoke (backtick: smoke per cell)",
  },
];

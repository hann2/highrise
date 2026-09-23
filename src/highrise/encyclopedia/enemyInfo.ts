import { ImageName } from "../../../resources/resources";

/** What the encyclopedia says about a kind of enemy */
export interface EnemyInfo {
  /** As given by `enemyTypeName` */
  name: string;
  image: ImageName;
  health: string;
  damage: string;
  speed: string;
  description: string;
}

// The enemies keep their numbers as constants in their own files
// (`enemies/*/<Name>.ts`); these mirror them, so update both together.
export const ENEMY_INFO: ReadonlyArray<EnemyInfo> = [
  {
    name: "Zombie",
    image: "zombieHead1",
    health: "100",
    damage: "10–15 per hit",
    speed: "Walking pace",
    description:
      "Goes for the nearest living thing. Sometimes gets back up as a crawler.",
  },
  {
    name: "Crawler",
    image: "crawlerHead1",
    health: "50–80",
    damage: "10–15 per hit",
    speed: "Slow",
    description: "What's left of a zombie. Still hungry.",
  },
  {
    name: "Sprinter",
    image: "zombieHead1",
    health: "60",
    damage: "10–15 per hit",
    speed: "Very fast",
    description:
      "Fragile, but it'll be on you before you've finished reloading.",
  },
  {
    name: "Heavy",
    image: "zombieHead1",
    health: "1000",
    damage: "30–45 per hit",
    speed: "Walking pace",
    description: "A big one. Hits hard and takes a lot of killing.",
  },
  {
    name: "Spitter",
    image: "spitter",
    health: "100",
    damage: "20 per glob",
    speed: "Slow",
    description: "Keeps its distance and spits from up to 10 m away.",
  },
  {
    name: "Necromancer",
    image: "necromancer",
    health: "2000",
    damage: "Spit, death orbs",
    speed: "Walking pace",
    description:
      "Raises the dead, hides behind a shield of them, and hurls death orbs.",
  },
];

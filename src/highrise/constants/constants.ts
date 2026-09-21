import { SoundName } from "../../../resources/resources";
// This file exists to avoid circular dependencies causing imports to return as undefined
// SO DON'T PUT ANY IMPORTS IN THIS FILE EXCEPT RESOURCES

import { BodyTextures } from "../creature-stuff/BodySprite";
import { EnemySounds } from "../enemies/base/EnemyVoice";

export const DEFAULT_LEVEL_SIZE = 14; // number of rows/columns
export const CELL_SIZE = 2;

// How long an entity will stick around
export enum Persistence {
  Floor = 0, // cleared at the end of each floor
  Game = 1, // cleared at the end of each game
  Menu = 2, // cleared between menus
  Permanent = 3, // never cleared
}

// Radius of a zombie in meters
export const ZOMBIE_RADIUS = 0.35; // meters

// Radius of a human in meters
export const HUMAN_RADIUS = 0.35; // meters

export const ZOMBIE_TEXTURES: BodyTextures[] = [
  {
    torso: "zombieTorso1",
    head: "zombieHead1",
    leftArm: "zombieLeftArm1",
    rightArm: "zombieRightArm1",
    leftHand: "zombieLeftHand1",
    rightHand: "zombieRightHand1",
  },
  {
    torso: "zombieTorso2",
    head: "zombieHead2",
    leftArm: "zombieLeftArm2",
    rightArm: "zombieRightArm2",
    leftHand: "zombieLeftHand2",
    rightHand: "zombieRightHand2",
  },
  {
    torso: "zombieTorso3",
    head: "zombieHead3",
    leftArm: "zombieLeftArm3",
    rightArm: "zombieRightArm3",
    leftHand: "zombieLeftHand3",
    rightHand: "zombieRightHand3",
  },
];

export const CRAWLER_TEXTURES: BodyTextures[] = [
  {
    torso: "crawlerTorso1",
    head: "crawlerHead1",
    leftArm: "crawlerLeftArm1",
    rightArm: "crawlerRightArm1",
    leftHand: "crawlerLeftHand1",
    rightHand: "crawlerRightHand1",
  },
  {
    torso: "crawlerTorso2",
    head: "crawlerHead2",
    leftArm: "crawlerLeftArm2",
    rightArm: "crawlerRightArm2",
    leftHand: "crawlerLeftHand2",
    rightHand: "crawlerRightHand2",
  },
  {
    torso: "crawlerTorso3",
    head: "crawlerHead3",
    leftArm: "crawlerLeftArm3",
    rightArm: "crawlerRightArm3",
    leftHand: "crawlerLeftHand3",
    rightHand: "crawlerRightHand3",
  },
];

export const RACHEL_ZOMBIE_SOUNDS: EnemySounds = {
  hit: ["rachelZombie5", "rachelZombie6", "rachelZombie13"],
  targetAquired: ["rachelZombie1", "rachelZombie8", "rachelZombie12"],
  attack: ["rachelZombie4", "rachelZombie7", "rachelZombie10"],
  death: ["rachelZombie3", "rachelZombie9"],
  idle: ["rachelZombie2", "rachelZombie11"],
};

export const KEVIN_ZOMBIE_SOUNDS: EnemySounds = {
  hit: [
    "kevinZombie4",
    "kevinZombie5",
    "kevinZombie12",
    "kevinZombie13",
    "kevinZombie14",
    "kevinZombie15",
    "kevinZombie18",
    "kevinZombie19",
    "kevinZombie23",
    "kevinZombie26",
    "kevinZombie29",
    "kevinZombie34",
    "kevinZombie36",
  ],
  targetAquired: [
    "kevinZombie1",
    "kevinZombie7",
    "kevinZombie9",
    "kevinZombie20",
    "kevinZombie37",
    "kevinZombie39",
  ],
  attack: [
    "kevinZombie2",
    "kevinZombie3",
    "kevinZombie8",
    "kevinZombie10",
    "kevinZombie11",
    "kevinZombie17",
    "kevinZombie24",
    "kevinZombie25",
    "kevinZombie38",
  ],
  death: [
    "kevinZombie21",
    "kevinZombie27",
    "kevinZombie28",
    "kevinZombie30",
    "kevinZombie31",
    "kevinZombie32",
    "kevinZombie33",
    "kevinZombie35",
  ],
  idle: [],
};

export const PERRY_ZOMBIE_SOUNDS: EnemySounds = {
  hit: ["perryZombie4", "perryZombie7"],
  targetAquired: ["perryZombie3"],
  attack: ["perryZombie10", "perryZombie2"],
  death: ["perryZombie1", "perryZombie9"],
  idle: ["perryZombie8", "perryZombie6"],
};

export const SPITTER_SOUNDS: EnemySounds = {
  ...RACHEL_ZOMBIE_SOUNDS,
  attack: ["spitterSpit1", "spitterSpit2", "spitterSpit3"],
};

export const ENEMY_SOUNDS: EnemySounds[] = [
  RACHEL_ZOMBIE_SOUNDS,
  KEVIN_ZOMBIE_SOUNDS,
  PERRY_ZOMBIE_SOUNDS,
  SPITTER_SOUNDS,
];

export const ZOMBIE_ATTACK_HIT_SOUNDS: SoundName[] = [
  "zombieBite1",
  "zombieBite2",
];

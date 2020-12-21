// This file exists to avoid circular dependencies causing imports to return as undefined
// SO DON'T PUT ANY IMPORTS IN THIS FILE EXCEPT RESOURCES

import snd_zombieBite1 from "../../../resources/audio/impacts/zombie-bite-1.flac";
import snd_zombieBite2 from "../../../resources/audio/impacts/zombie-bite-2.flac";
import snd_perryZombie1 from "../../../resources/audio/zombie/perry-zombie-1.flac";
import snd_perryZombie10 from "../../../resources/audio/zombie/perry-zombie-10.flac";
import snd_perryZombie2 from "../../../resources/audio/zombie/perry-zombie-2.flac";
import snd_perryZombie3 from "../../../resources/audio/zombie/perry-zombie-3.flac";
import snd_perryZombie4 from "../../../resources/audio/zombie/perry-zombie-4.flac";
import snd_perryZombie6 from "../../../resources/audio/zombie/perry-zombie-6.flac";
import snd_perryZombie7 from "../../../resources/audio/zombie/perry-zombie-7.flac";
import snd_perryZombie8 from "../../../resources/audio/zombie/perry-zombie-8.flac";
import snd_perryZombie9 from "../../../resources/audio/zombie/perry-zombie-9.flac";
import snd_rachelZombie1 from "../../../resources/audio/zombie/rachel-zombie-1.flac";
import snd_rachelZombie10 from "../../../resources/audio/zombie/rachel-zombie-10.flac";
import snd_rachelZombie11 from "../../../resources/audio/zombie/rachel-zombie-11.flac";
import snd_rachelZombie12 from "../../../resources/audio/zombie/rachel-zombie-12.flac";
import snd_rachelZombie13 from "../../../resources/audio/zombie/rachel-zombie-13.flac";
import snd_rachelZombie2 from "../../../resources/audio/zombie/rachel-zombie-2.flac";
import snd_rachelZombie3 from "../../../resources/audio/zombie/rachel-zombie-3.flac";
import snd_rachelZombie4 from "../../../resources/audio/zombie/rachel-zombie-4.flac";
import snd_rachelZombie5 from "../../../resources/audio/zombie/rachel-zombie-5.flac";
import snd_rachelZombie6 from "../../../resources/audio/zombie/rachel-zombie-6.flac";
import snd_rachelZombie7 from "../../../resources/audio/zombie/rachel-zombie-7.flac";
import snd_rachelZombie8 from "../../../resources/audio/zombie/rachel-zombie-8.flac";
import snd_rachelZombie9 from "../../../resources/audio/zombie/rachel-zombie-9.flac";
import snd_spitterSpit1 from "../../../resources/audio/zombie/spitter-spit-1.flac";
import snd_spitterSpit2 from "../../../resources/audio/zombie/spitter-spit-2.flac";
import snd_spitterSpit3 from "../../../resources/audio/zombie/spitter-spit-3.flac";
import img_crawlerHead1 from "../../../resources/images/zombies/crawler-head-1.png";
import img_crawlerHead2 from "../../../resources/images/zombies/crawler-head-2.png";
import img_crawlerHead3 from "../../../resources/images/zombies/crawler-head-3.png";
import img_crawlerLeftArm1 from "../../../resources/images/zombies/crawler-left-arm-1.png";
import img_crawlerLeftArm2 from "../../../resources/images/zombies/crawler-left-arm-2.png";
import img_crawlerLeftArm3 from "../../../resources/images/zombies/crawler-left-arm-3.png";
import img_crawlerLeftHand1 from "../../../resources/images/zombies/crawler-left-hand-1.png";
import img_crawlerLeftHand2 from "../../../resources/images/zombies/crawler-left-hand-2.png";
import img_crawlerLeftHand3 from "../../../resources/images/zombies/crawler-left-hand-3.png";
import img_crawlerRightArm1 from "../../../resources/images/zombies/crawler-right-arm-1.png";
import img_crawlerRightArm2 from "../../../resources/images/zombies/crawler-right-arm-2.png";
import img_crawlerRightArm3 from "../../../resources/images/zombies/crawler-right-arm-3.png";
import img_crawlerRightHand1 from "../../../resources/images/zombies/crawler-right-hand-1.png";
import img_crawlerRightHand2 from "../../../resources/images/zombies/crawler-right-hand-2.png";
import img_crawlerRightHand3 from "../../../resources/images/zombies/crawler-right-hand-3.png";
import img_crawlerTorso1 from "../../../resources/images/zombies/crawler-torso-1.png";
import img_crawlerTorso2 from "../../../resources/images/zombies/crawler-torso-2.png";
import img_crawlerTorso3 from "../../../resources/images/zombies/crawler-torso-3.png";
import img_zombieHead1 from "../../../resources/images/zombies/zombie-head-1.png";
import img_zombieHead2 from "../../../resources/images/zombies/zombie-head-2.png";
import img_zombieHead3 from "../../../resources/images/zombies/zombie-head-3.png";
import img_zombieLeftArm1 from "../../../resources/images/zombies/zombie-left-arm-1.png";
import img_zombieLeftArm2 from "../../../resources/images/zombies/zombie-left-arm-2.png";
import img_zombieLeftArm3 from "../../../resources/images/zombies/zombie-left-arm-3.png";
import img_zombieLeftHand1 from "../../../resources/images/zombies/zombie-left-hand-1.png";
import img_zombieLeftHand2 from "../../../resources/images/zombies/zombie-left-hand-2.png";
import img_zombieLeftHand3 from "../../../resources/images/zombies/zombie-left-hand-3.png";
import img_zombieRightArm1 from "../../../resources/images/zombies/zombie-right-arm-1.png";
import img_zombieRightArm2 from "../../../resources/images/zombies/zombie-right-arm-2.png";
import img_zombieRightArm3 from "../../../resources/images/zombies/zombie-right-arm-3.png";
import img_zombieRightHand1 from "../../../resources/images/zombies/zombie-right-hand-1.png";
import img_zombieRightHand2 from "../../../resources/images/zombies/zombie-right-hand-2.png";
import img_zombieRightHand3 from "../../../resources/images/zombies/zombie-right-hand-3.png";
import img_zombieTorso1 from "../../../resources/images/zombies/zombie-torso-1.png";
import img_zombieTorso2 from "../../../resources/images/zombies/zombie-torso-2.png";
import img_zombieTorso3 from "../../../resources/images/zombies/zombie-torso-3.png";
import { BodyTextures } from "../creature-stuff/BodySprite";
import { EnemySounds } from "../enemies/base/EnemyVoice";

export const LEVEL_SIZE = 14;
export const CELL_WIDTH = 2;

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
    torso: img_zombieTorso1,
    head: img_zombieHead1,
    leftArm: img_zombieLeftArm1,
    rightArm: img_zombieRightArm1,
    leftHand: img_zombieLeftHand1,
    rightHand: img_zombieRightHand1,
  },
  {
    torso: img_zombieTorso2,
    head: img_zombieHead2,
    leftArm: img_zombieLeftArm2,
    rightArm: img_zombieRightArm2,
    leftHand: img_zombieLeftHand2,
    rightHand: img_zombieRightHand2,
  },
  {
    torso: img_zombieTorso3,
    head: img_zombieHead3,
    leftArm: img_zombieLeftArm3,
    rightArm: img_zombieRightArm3,
    leftHand: img_zombieLeftHand3,
    rightHand: img_zombieRightHand3,
  },
];

export const CRAWLER_TEXTURES: BodyTextures[] = [
  {
    torso: img_crawlerTorso1,
    head: img_crawlerHead1,
    leftArm: img_crawlerLeftArm1,
    rightArm: img_crawlerRightArm1,
    leftHand: img_crawlerLeftHand1,
    rightHand: img_crawlerRightHand1,
  },
  {
    torso: img_crawlerTorso2,
    head: img_crawlerHead2,
    leftArm: img_crawlerLeftArm2,
    rightArm: img_crawlerRightArm2,
    leftHand: img_crawlerLeftHand2,
    rightHand: img_crawlerRightHand2,
  },
  {
    torso: img_crawlerTorso3,
    head: img_crawlerHead3,
    leftArm: img_crawlerLeftArm3,
    rightArm: img_crawlerRightArm3,
    leftHand: img_crawlerLeftHand3,
    rightHand: img_crawlerRightHand3,
  },
];

export const RACHEL_ZOMBIE_SOUNDS: EnemySounds = {
  hit: [snd_rachelZombie5, snd_rachelZombie6, snd_rachelZombie13],
  targetAquired: [snd_rachelZombie1, snd_rachelZombie8, snd_rachelZombie12],
  attack: [snd_rachelZombie4, snd_rachelZombie7, snd_rachelZombie10],
  death: [snd_rachelZombie3, snd_rachelZombie9],
  idle: [snd_rachelZombie2, snd_rachelZombie11],
};

export const PERRY_ZOMBIE_SOUNDS: EnemySounds = {
  hit: [snd_perryZombie4, snd_perryZombie7],
  targetAquired: [snd_perryZombie3],
  attack: [snd_perryZombie10, snd_perryZombie2],
  death: [snd_perryZombie1, snd_perryZombie9],
  idle: [snd_perryZombie8, snd_perryZombie6],
};

export const SPITTER_SOUNDS: EnemySounds = {
  ...RACHEL_ZOMBIE_SOUNDS,
  attack: [snd_spitterSpit1, snd_spitterSpit2, snd_spitterSpit3],
};

export const ENEMY_SOUNDS: EnemySounds[] = [
  RACHEL_ZOMBIE_SOUNDS,
  PERRY_ZOMBIE_SOUNDS,
  SPITTER_SOUNDS,
];

export const ZOMBIE_ATTACK_HIT_SOUNDS = [snd_zombieBite1, snd_zombieBite2];

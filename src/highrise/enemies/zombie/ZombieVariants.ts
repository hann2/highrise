import { ImageName } from "../../../../resources/resources";
import {
  CRAWLER_TEXTURES,
  KEVIN_ZOMBIE_SOUNDS,
  RACHEL_ZOMBIE_SOUNDS,
  ZOMBIE_LEG_COLORS,
  ZOMBIE_LEGS,
  ZOMBIE_TEXTURES,
} from "../../constants/constants";
import { BodyTextures } from "../../creature-stuff/BodySprite";
import { LegColors } from "../../creature-stuff/Legs";
import { EnemySounds } from "../base/EnemyVoice";

export interface ZombieVariant {
  textures: BodyTextures;
  sounds: EnemySounds;
  /** Lying down, from the waist up: as a crawler, and as a corpse */
  crawlerTextures: BodyTextures;
  /** Its legs lying down, for its corpse */
  legs: ImageName;
  /** Its legs up and walking */
  legColors: LegColors;
}

export const ZOMBIE_VARIANTS: ZombieVariant[] = [];
for (let i = 0; i < ZOMBIE_TEXTURES.length; i++) {
  ZOMBIE_VARIANTS.push({
    textures: ZOMBIE_TEXTURES[i],
    sounds: RACHEL_ZOMBIE_SOUNDS,
    crawlerTextures: CRAWLER_TEXTURES[i],
    legs: ZOMBIE_LEGS[i],
    legColors: ZOMBIE_LEG_COLORS[i],
  });
}

export const SPRINTER_VARIANTS: ZombieVariant[] = [];
for (let i = 0; i < ZOMBIE_TEXTURES.length; i++) {
  SPRINTER_VARIANTS.push({
    textures: ZOMBIE_TEXTURES[i],
    sounds: KEVIN_ZOMBIE_SOUNDS,
    crawlerTextures: CRAWLER_TEXTURES[i],
    legs: ZOMBIE_LEGS[i],
    legColors: ZOMBIE_LEG_COLORS[i],
  });
}

import {
  CRAWLER_TEXTURES,
  RACHEL_ZOMBIE_SOUNDS,
  ZOMBIE_TEXTURES,
} from "../../constants/constants";
import { BodyTextures } from "../../creature-stuff/BodySprite";
import { EnemySounds } from "../base/EnemyVoice";

export interface ZombieVariant {
  textures: BodyTextures;
  sounds: EnemySounds;
  crawlerTextures?: BodyTextures;
}

export const ZOMBIE_VARIANTS: ZombieVariant[] = [];
for (let i = 0; i < ZOMBIE_TEXTURES.length; i++) {
  ZOMBIE_VARIANTS.push({
    textures: ZOMBIE_TEXTURES[i],
    sounds: RACHEL_ZOMBIE_SOUNDS,
    crawlerTextures: CRAWLER_TEXTURES[i],
  });
}

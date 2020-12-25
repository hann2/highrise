import { SoundName } from "../../core/resources/sounds";
import { BodyTextures } from "../creature-stuff/BodySprite";
import { ShuffleRing } from "../utils/ShuffleRing";
import { Andy } from "./Andy";
import { Chad } from "./Chad";
import { Cindy } from "./Cindy";
import { Clarice } from "./Clarice";
import { Clyde } from "./Clyde";
import { DustyRusty } from "./DustyRusty";
import { Kyle } from "./Kyle";
import { LuckyJack } from "./LuckyJack";
import { Nancy } from "./Nancy";
import { Santa } from "./Santa";
import { Simon } from "./Simon";
import { Takeshi } from "./Takeshi";
import { Wendy } from "./Wendy";

// Data about a character
export interface Character {
  textures: CharacterTextures;
  sounds: CharacterSounds;
}

export interface CharacterTextures extends BodyTextures {}

export interface CharacterSounds {
  death: SoundName[];
  hurt: SoundName[];
  joinParty: SoundName[];
  lookHere: SoundName[];
  misc: SoundName[];
  nearDeath: SoundName[];
  newLevel: SoundName[];
  pickupItem: SoundName[];
  pickupGun: SoundName[];
  pickupMelee: SoundName[];
  pickupHealth: SoundName[];
  relief: SoundName[];
  taunts: SoundName[];
  worried: SoundName[];
}

export type CharacterSoundClass = keyof CharacterSounds;

export const CHARACTERS = [
  Andy,
  Chad,
  Cindy,
  Clarice,
  Clyde,
  DustyRusty,
  Kyle,
  LuckyJack,
  Nancy,
  Santa,
  Simon,
  Takeshi,
  Wendy,
];

const CHARACTERS_SHUFFLED = new ShuffleRing(CHARACTERS);
export function randomCharacter(): Character {
  return CHARACTERS_SHUFFLED.getNext();
}

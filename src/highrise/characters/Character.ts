import { SoundName } from "../../core/resources/sounds";
import { shuffle } from "../../core/util/Random";
import { Andy } from "./Andy";
import { Chad } from "./Chad";
import { Cindy } from "./Cindy";
import { Clarice } from "./Clarice";
import { Clyde } from "./Clyde";
import { Kyle } from "./Kyle";
import { Nancy } from "./Nancy";
import { Simon } from "./Simon";
import { Wendy } from "./Wendy";

// Data about a character
export interface Character {
  textures: CharacterTextures;
  sounds: CharacterSounds;
}

export interface CharacterTextures {
  stand: string;
  gun: string;
  reload: string;
  hold: string;
}

export interface CharacterSounds {
  death: SoundName[];
  hurt: SoundName[];
  joinParty: SoundName[];
  lookHere: SoundName[];
  misc: SoundName[];
  nearDeath: SoundName[];
  newLevel: SoundName[];
  pickupItem: SoundName[];
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
  Kyle,
  Nancy,
  Simon,
  Wendy,
];

const CHARACTERS_SHUFFLED = shuffle([...CHARACTERS]);
let characterId = 0;
export function randomCharacter(): Character {
  characterId++;
  return CHARACTERS_SHUFFLED[characterId % CHARACTERS_SHUFFLED.length];
}

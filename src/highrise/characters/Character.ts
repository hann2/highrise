import { SoundName } from "../../core/resources/sounds";
import { choose, shuffle } from "../../core/util/Random";
import { Cindy } from "./Cindy";
import { Clarice } from "./Clarice";
import { Clyde } from "./Clyde";
import { Kyle } from "./Kyle";
import { Nancy } from "./Nancy";
import { Simon } from "./Simon";

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

export const CHARACTERS = [Cindy, Clarice, Clyde, Kyle, Nancy, Simon];

const CHARACTERS_SHUFFLED = shuffle([...CHARACTERS]);
let characterId = 0;
export function randomCharacter(): Character {
  characterId++;
  return CHARACTERS_SHUFFLED[characterId % CHARACTERS_SHUFFLED.length];
}

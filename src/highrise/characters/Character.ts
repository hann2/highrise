import { SoundName } from "../../core/resources/sounds";
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
import { Simon } from "./Simon";
import { Takeshi } from "./Takeshi";
import { Wendy } from "./Wendy";

// Data about a character
export interface Character {
  textures: CharacterTextures;
  sounds: CharacterSounds;
}

export interface CharacterTextures {
  head: string;
  torso: string;
  leftHand: string;
  rightHand: string;
  leftArm: string;
  rightArm: string;
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
  DustyRusty,
  Clyde,
  Kyle,
  LuckyJack,
  Nancy,
  Simon,
  Takeshi,
  Wendy,
];

const CHARACTERS_SHUFFLED = new ShuffleRing(CHARACTERS);
export function randomCharacter(): Character {
  return CHARACTERS_SHUFFLED.getNext();
}

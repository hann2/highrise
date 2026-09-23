import { SoundName } from "../../../resources/resources";
import { choose } from "../../core/util/Random";
import { BodyTextures } from "../creature-stuff/BodySprite";
import { loadSaveData } from "../persistence/SaveData";
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
  name: string;
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

// Characters that are in the party, so survivors shouldn't look like them
let charactersInUse: ReadonlySet<Character> = new Set();

export function setCharactersInUse(characters: Iterable<Character>) {
  charactersInUse = new Set(characters);
}

/** A character nobody in the party already is. */
export function randomCharacter(): Character {
  let character = CHARACTERS_SHUFFLED.getNext();
  while (charactersInUse.has(character)) {
    character = CHARACTERS_SHUFFLED.getNext();
  }
  return character;
}

/**
 * Who the survivor on a floor is: someone the player hasn't unlocked yet if
 * possible, since getting them out unlocks them, and never someone already in
 * the party. Seeded like the rest of level generation.
 */
export function randomSurvivorCharacter(): Character {
  const unlocked = new Set(loadSaveData().unlockedCharacters);
  const available = CHARACTERS.filter((c) => !charactersInUse.has(c));
  const locked = available.filter((c) => !unlocked.has(c.name));
  return choose(...(locked.length > 0 ? locked : available));
}

export function getCharacterByName(name: string): Character | undefined {
  return CHARACTERS.find((character) => character.name === name);
}

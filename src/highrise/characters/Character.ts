import { ImageName, RESOURCES, SoundName } from "../../../resources/resources";
import { choose } from "../../core/util/Random";
import { BodyTextures } from "../creature-stuff/BodySprite";
import { PlayerStats } from "../human/PlayerStats";
import { loadSaveData } from "../persistence/SaveData";
import { ShuffleRing } from "../utils/ShuffleRing";
import { GUNS } from "../weapons/guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "../weapons/melee/melee-weapons/meleeWeapons";
import { WeaponStats } from "../weapons/WeaponStats";
import {
  CHARACTER_SOUND_CLASSES,
  CharacterData,
  characterDataProblems,
  CharacterSoundClass,
  clipSoundName,
} from "./CharacterData";
import andy from "./data/andy.json";
import chad from "./data/chad.json";
import cindy from "./data/cindy.json";
import clarice from "./data/clarice.json";
import clyde from "./data/clyde.json";
import dustyRusty from "./data/dusty-rusty.json";
import kyle from "./data/kyle.json";
import luckyJack from "./data/lucky-jack.json";
import nancy from "./data/nancy.json";
import santa from "./data/santa.json";
import simon from "./data/simon.json";
import takeshi from "./data/takeshi.json";
import wendy from "./data/wendy.json";

export type { CharacterSoundClass } from "./CharacterData";

/** A character, made from their `data/<id>.json` (see `CharacterData`) */
export interface Character {
  /** Their data file's name, which also names their audio folders */
  id: string;
  name: string;
  textures: CharacterTextures;
  /** Changes to the neutral `PlayerStats` */
  stats: Partial<PlayerStats>;
  startingWeapons: WeaponStats[];
  /** Enabled clips' sounds, by when they're said */
  sounds: CharacterSounds;
  data: CharacterData;
}

export interface CharacterTextures extends BodyTextures {}

export type CharacterSounds = Record<CharacterSoundClass, SoundName[]>;

// The stats indexes, not `weapons.ts`: that brings in `Gun`, which imports
// `Human`, which imports this, and characters are made at load time
const WEAPON_STATS: WeaponStats[] = [...GUNS, ...MELEE_WEAPONS];

const CHARACTER_DATA: Record<string, unknown> = {
  andy,
  chad,
  cindy,
  clarice,
  clyde,
  "dusty-rusty": dustyRusty,
  kyle,
  "lucky-jack": luckyJack,
  nancy,
  santa,
  simon,
  takeshi,
  wendy,
};

function makeCharacter(id: string, data: CharacterData): Character {
  const sounds = Object.fromEntries(
    CHARACTER_SOUND_CLASSES.map((soundClass) => [soundClass, []]),
  ) as unknown as CharacterSounds;
  for (const clip of data.clips) {
    if (clip.enabled) {
      for (const soundClass of clip.categories) {
        sounds[soundClass].push(clipSoundName(clip) as SoundName);
      }
    }
  }
  return {
    id,
    name: data.name,
    textures: data.textures as Record<keyof BodyTextures, ImageName>,
    stats: data.stats,
    startingWeapons: data.startingWeapons.map((name) =>
      WEAPON_STATS.find((weapon) => weapon.name === name)!,
    ),
    sounds,
    data,
  };
}

/**
 * The JSON isn't type checked against the manifest the way TypeScript would
 * be, so in development a bad reference fails loudly here. The same check
 * runs in `npm run test:characters`.
 */
function checkCharacterData() {
  const problems = Object.entries(CHARACTER_DATA).flatMap(([id, data]) =>
    characterDataProblems(id, data as CharacterData, {
      imageNames: new Set(Object.keys(RESOURCES.images)),
      soundNames: new Set(Object.keys(RESOURCES.sounds)),
      weaponNames: new Set(WEAPON_STATS.map((weapon) => weapon.name)),
    }),
  );
  if (problems.length > 0) {
    throw new Error(`Bad character data:\n${problems.join("\n")}`);
  }
}

if (process.env.NODE_ENV === "development") {
  checkCharacterData();
}

export const CHARACTERS: Character[] = Object.entries(CHARACTER_DATA).map(
  ([id, data]) => makeCharacter(id, data as CharacterData),
);

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

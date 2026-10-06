import { resourceName } from "../../core/resources/resourceName";
import { lookProblems, PartialLook } from "../looks/BodyLook";
import { PlayerStats } from "../human/PlayerStats";

/** When a character speaks, in the order the character editor lists them */
export const CHARACTER_SOUND_CLASSES = [
  "joinParty",
  "newLevel",
  "misc",
  "lookHere",
  "pickupGun",
  "pickupMelee",
  "pickupHealth",
  "pickupItem",
  "taunts",
  "worried",
  "hurt",
  "nearDeath",
  "death",
  "relief",
] as const;

export type CharacterSoundClass = (typeof CHARACTER_SOUND_CLASSES)[number];

/**
 * A character as stored in `characters/data/<id>.json`, which is what the
 * character editor reads and writes. `Character.ts` turns these into
 * `Character`s. The id is the file name, and names the character's audio
 * folders: `resources/audio/characters/<id>/` for enabled clips (they ship)
 * and `assets/source/voices/<id>/` for disabled ones (they don't).
 */
export interface CharacterData {
  name: string;
  /** Who they are, for writing their lines */
  description: string;
  /** What they look like, which their body is drawn from (`looks/`); the default look's for anything left out */
  look: PartialLook;
  /** Changes to the neutral `PlayerStats`, applied before any items */
  stats: Partial<PlayerStats>;
  /** Weapon names (`WeaponStats.name`), given at the start of a run and to them as a survivor */
  startingWeapons: string[];
  /** The ElevenLabs voice their lines are generated with */
  voice?: { elevenLabsVoiceId: string };
  clips: VoiceClip[];
}

/** One audio file of a character saying something */
export interface VoiceClip {
  /** File name with extension, in the enabled or disabled audio folder */
  file: string;
  /** What's said, with ElevenLabs v3 audio tags like `[sighs]`. Empty if not transcribed yet. */
  text: string;
  /** When it can be said */
  categories: CharacterSoundClass[];
  /** Whether it's in the game. Enabled clips' files are in `resources/`. */
  enabled: boolean;
  source: "recorded" | "elevenlabs";
  /** For generated clips: what they were generated with, and when (YYYY-MM-DD) */
  voiceId?: string;
  model?: string;
  created?: string;
  /** ElevenLabs stability it was generated with: 0 is the most expressive, 1 the steadiest */
  stability?: number;
  /** For voice changed clips: how closely it was made to stick to the voice (0 to 1) */
  similarity?: number;
  /** For voice changed clips: whether ElevenLabs took the background noise out first */
  removeBackgroundNoise?: boolean;
  /**
   * The file of the clip this one was regenerated from, or, made with the
   * voice changer (an `_sts_` model), the performance it was made from
   */
  basedOn?: string;
}

/** The name a clip's sound has in the manifest, when it's enabled */
export function clipSoundName(clip: VoiceClip): string {
  return resourceName(clip.file);
}

/** What exists for character data to refer to */
export interface CharacterDataContext {
  /** Sound names in the manifest, so every enabled clip and no disabled one */
  soundNames: ReadonlySet<string>;
  weaponNames: ReadonlySet<string>;
}

/** Everything wrong with a character's data, or nothing */
export function characterDataProblems(
  id: string,
  data: CharacterData,
  context: CharacterDataContext,
): string[] {
  const problems: string[] = [];
  const problem = (message: string) => problems.push(`${id}: ${message}`);

  if (!data.name) {
    problem("has no name");
  }

  lookProblems(data.look).forEach(problem);

  const neutral = new PlayerStats();
  for (const [stat, value] of Object.entries(data.stats ?? {})) {
    if (!(stat in neutral)) {
      problem(`"${stat}" isn't a PlayerStats stat`);
    } else if (typeof value !== typeof neutral[stat as keyof PlayerStats]) {
      problem(
        `stat ${stat} should be a ${typeof neutral[stat as keyof PlayerStats]}`,
      );
    }
  }

  for (const weapon of data.startingWeapons ?? []) {
    if (!context.weaponNames.has(weapon)) {
      problem(`starting weapon "${weapon}" isn't a weapon`);
    }
  }

  const files = new Set<string>();
  for (const clip of data.clips ?? []) {
    if (files.has(clip.file)) {
      problem(`clip ${clip.file} is listed twice`);
    }
    files.add(clip.file);
    for (const category of clip.categories) {
      if (!CHARACTER_SOUND_CLASSES.includes(category)) {
        problem(`clip ${clip.file} has an unknown category "${category}"`);
      }
    }
    const inManifest = context.soundNames.has(clipSoundName(clip));
    if (clip.enabled && !inManifest) {
      problem(`clip ${clip.file} is enabled but isn't in the manifest`);
    } else if (!clip.enabled && inManifest) {
      problem(`clip ${clip.file} is disabled but is in the manifest`);
    }
  }

  return problems;
}

/** What the character editor's page and server send each other */
import {
  CharacterData,
  CharacterSoundClass,
  VoiceClip,
} from "../../highrise/characters/CharacterData";

export interface CharacterEntry {
  id: string;
  data: CharacterData;
}

export interface Voice {
  voiceId: string;
  name: string;
  description: string;
  category: string;
  previewUrl?: string;
  labels: Record<string, string>;
}

/**
 * The part of a character the editor can change directly (clips have their
 * own calls). A `voice` of null removes it.
 */
export type CharacterChanges = Partial<
  Omit<CharacterData, "clips" | "voice"> & {
    voice: CharacterData["voice"] | null;
  }
>;

/** The part of a clip the editor can change directly */
export type ClipChanges = Partial<
  Pick<VoiceClip, "text" | "categories" | "enabled">
>;

export interface GenerateRequest {
  text: string;
  categories: CharacterSoundClass[];
  count: number;
  /** ElevenLabs v3 takes 0 (creative), 0.5 (natural) or 1 (robust) */
  stability?: number;
  /** The file of the clip these are variations of */
  basedOn?: string;
}

/** ElevenLabs' voice changer models: one for English, one for any language */
export const CONVERSION_MODELS = [
  "eleven_english_sts_v2",
  "eleven_multilingual_sts_v2",
] as const;

export type ConversionModel = (typeof CONVERSION_MODELS)[number];

/** Voice changer settings for performing a clip again in the character's voice */
export interface ConvertRequest {
  count: number;
  model: ConversionModel;
  /** 0 is the most expressive, 1 the steadiest */
  stability: number;
  /** How closely the takes stick to the voice, from 0 to 1 */
  similarity: number;
  /** Has ElevenLabs take the room's noise out of the recording first */
  removeBackgroundNoise: boolean;
}

/**
 * Where a dragged clip goes: before or after another clip, or with neither,
 * to the end. With `categories`, it's dropped into another category too.
 */
export interface ClipMove {
  before?: string;
  after?: string;
  categories?: CharacterSoundClass[];
}

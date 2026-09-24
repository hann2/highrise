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

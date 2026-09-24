/** Calls to the character editor server (`bin/character-editor/server.ts`) */
import {
  CharacterData,
  VoiceClip,
} from "../../highrise/characters/CharacterData";
import {
  CharacterChanges,
  CharacterEntry,
  ClipChanges,
  GenerateRequest,
  Voice,
} from "./apiTypes";

async function call<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the editor server. Is `npm start` running?");
  }
  const text = await response.text();
  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      response.ok
        ? `Unexpected response from ${url}`
        : `The editor server isn't running (${response.status}). Start it with npm start or npm run character-editor.`,
    );
  }
  if (!response.ok) {
    throw new Error(result.error ?? `${response.status} from ${url}`);
  }
  return result as T;
}

const character = (id: string) => `/api/characters/${encodeURIComponent(id)}`;
const clip = (id: string, file: string) =>
  `${character(id)}/clips/${encodeURIComponent(file)}`;

export const api = {
  characters: () => call<CharacterEntry[]>("GET", "/api/characters"),
  voices: () => call<Voice[]>("GET", "/api/voices"),
  updateCharacter: (id: string, changes: CharacterChanges) =>
    call<CharacterData>("PATCH", character(id), changes),
  updateClip: (id: string, file: string, changes: ClipChanges) =>
    call<VoiceClip>("PATCH", clip(id, file), changes),
  deleteClip: (id: string, file: string) => call<{}>("DELETE", clip(id, file)),
  transcribe: (id: string, file: string) =>
    call<VoiceClip>("POST", `${clip(id, file)}/transcribe`),
  generate: (id: string, request: GenerateRequest) =>
    call<VoiceClip[]>("POST", `${character(id)}/generate`, request),
  audioUrl: (id: string, file: string) =>
    `${character(id)}/audio/${encodeURIComponent(file)}`,
};

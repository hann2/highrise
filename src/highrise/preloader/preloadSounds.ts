import { SOUND_URLS } from "../../core/resources/sounds";

// TODO: Get stuff from here, not the other place
export function getSoundsToPreload(): string[] {
  return Object.keys(SOUND_URLS);
}

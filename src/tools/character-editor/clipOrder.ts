/** Rearranging clips, on the page as it's dropped and on the server as it's saved */
import { VoiceClip } from "../../highrise/characters/CharacterData";
import { ClipMove } from "./apiTypes";

/**
 * `clips` with `file` taken out and put back where `move` says, without
 * changing `clips`, or undefined if either clip isn't there. Each category
 * lists its clips in this order.
 */
export function moveClip(
  clips: readonly VoiceClip[],
  file: string,
  { before, after, categories }: ClipMove,
): VoiceClip[] | undefined {
  const clip = clips.find((c) => c.file === file);
  if (!clip) {
    return undefined;
  }
  const moved = categories ? { ...clip, categories } : clip;
  const target = before ?? after;
  if (target === file) {
    return clips.map((c) => (c === clip ? moved : c));
  }
  const rest = clips.filter((c) => c !== clip);
  if (target === undefined) {
    return [...rest, moved];
  }
  const index = rest.findIndex((c) => c.file === target);
  if (index === -1) {
    return undefined;
  }
  rest.splice(before ? index : index + 1, 0, moved);
  return rest;
}

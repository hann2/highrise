import { SoundName } from "../../../resources/resources";
import { getSoundBuffer } from "../resources/sounds";
import { rUniform } from "./Random";

// Useful for having multiple overlapping sounds not start in sync
export function startAtRandomOffset(source: AudioBufferSourceNode): void {
  if (!source.buffer) {
    throw new Error("Cannot start a source without a buffer");
  }
  source.start(undefined, rUniform(0, source.buffer.duration));
}

export function createLoopingSource(
  audioContext: AudioContext,
  soundName: SoundName,
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = getSoundBuffer(soundName);
  source.loop = true;
  startAtRandomOffset(source);
  return source;
}

import { SoundName, SOUNDS } from "../resources/sounds";

// Useful for having multiple overlapping sounds not start in sync
export function startAtRandomOffset(source: AudioBufferSourceNode): void {
  if (!source.buffer) {
    throw new Error("Cannot start a source without a buffer");
  }
  source.start(undefined, Math.random() * source.buffer.duration);
}

export function createLoopingSource(
  audioContext: AudioContext,
  soundName: SoundName
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = SOUNDS.get(soundName)!;
  source.loop = true;
  startAtRandomOffset(source);
  return source;
}

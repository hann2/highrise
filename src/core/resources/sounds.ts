export type SoundName = string;

export const SoundBuffers: Map<string, AudioBuffer> = new Map();

export async function loadSound(
  url: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((data) => audioContext.decodeAudioData(data))
    .then((buffer) => {
      SoundBuffers.set(url, buffer);
      return buffer;
    });
}

export function getSoundDuration(soundName: SoundName): number {
  return SoundBuffers.get(soundName)?.duration ?? -1;
}

export function soundIsLoaded(name: SoundName) {
  return SoundBuffers.get(name) != undefined;
}

import pop1 from "../../../resources/audio/pop1.flac";

// TODO: These shouln't be listed in core/
export const SOUND_URLS = {
  pop1,
};

export type SoundName = keyof typeof SOUND_URLS;

export const SOUNDS: Map<SoundName, AudioBuffer> = new Map();

export async function loadSound(
  name: SoundName,
  url: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((data) => audioContext.decodeAudioData(data))
    .then((buffer) => {
      SOUNDS.set(name, buffer);
      return buffer;
    });
}

export function getSoundDuration(soundName: SoundName): number {
  return SOUNDS.get(soundName)?.duration ?? -1;
}

export function soundIsLoaded(name: SoundName) {
  return SOUNDS.get(name) != undefined;
}

export function loadAllSounds(audioContext: AudioContext) {
  return Promise.all(
    Object.entries(SOUND_URLS).map(([name, url]) =>
      loadSound(name as SoundName, url, audioContext)
    )
  );
}

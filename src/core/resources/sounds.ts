import fleshHit1 from "../../../resources/audio/flesh-hit-1.flac";
import gunShot1 from "../../../resources/audio/gun-shot-1.flac";
import gunShot2 from "../../../resources/audio/gun-shot-2.flac";
import pop1 from "../../../resources/audio/pop1.flac";
import wallHit1 from "../../../resources/audio/wall-hit-1.flac";
import wallHit2 from "../../../resources/audio/wall-hit-2.flac";
import zombieHit1 from "../../../resources/audio/zombie-hit-1.flac";
import zombieHit2 from "../../../resources/audio/zombie-hit-2.flac";
import humanHit1 from "../../../resources/audio/human-hit-1.flac";
import humanHit2 from "../../../resources/audio/human-hit-2.flac";

// TODO: These shouln't be listed in core/
export const SOUND_URLS = {
  fleshHit1,
  gunShot1,
  gunShot2,
  humanHit1,
  humanHit2,
  pop1,
  wallHit1,
  wallHit2,
  zombieHit1,
  zombieHit2,
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

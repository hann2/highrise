import simonDeath1 from "../../../resources/audio/characters/simon/simon-death-1.flac";
import simonHurt1 from "../../../resources/audio/characters/simon/simon-hurt-1.flac";
import simonHurt2 from "../../../resources/audio/characters/simon/simon-hurt-2.flac";
import simonHurt3 from "../../../resources/audio/characters/simon/simon-hurt-3.flac";
import simonHurt4 from "../../../resources/audio/characters/simon/simon-hurt-4.flac";
import simonHurt5 from "../../../resources/audio/characters/simon/simon-hurt-5.flac";
import simonHurt6 from "../../../resources/audio/characters/simon/simon-hurt-6.flac";
import simonHurt7 from "../../../resources/audio/characters/simon/simon-hurt-7.flac";
import simonJoinParty1 from "../../../resources/audio/characters/simon/simon-join-party-1.flac";
import simonLookHere1 from "../../../resources/audio/characters/simon/simon-look-here-1.flac";
import simonLookHere2 from "../../../resources/audio/characters/simon/simon-look-here-2.flac";
import simonNearDeath2 from "../../../resources/audio/characters/simon/simon-near-death-2.flac";
import simonPickupItem1 from "../../../resources/audio/characters/simon/simon-pickup-item-1.flac";
import simonPickupItem2 from "../../../resources/audio/characters/simon/simon-pickup-item-2.flac";
import simonPickupItem3 from "../../../resources/audio/characters/simon/simon-pickup-item-3.flac";
import simonRelief1 from "../../../resources/audio/characters/simon/simon-relief-1.flac";
import simonTaunt1 from "../../../resources/audio/characters/simon/simon-taunt-1.flac";
import simonTaunt2 from "../../../resources/audio/characters/simon/simon-taunt-2.flac";
import simonWorried1 from "../../../resources/audio/characters/simon/simon-worried-1.flac";
import simonWorried2 from "../../../resources/audio/characters/simon/simon-worried-2.flac";
import simonWorried3 from "../../../resources/audio/characters/simon/simon-worried-3.flac";
import fleshHit1 from "../../../resources/audio/flesh-hit-1.flac";
import gunShot1 from "../../../resources/audio/gun-shot-1.flac";
import gunShot2 from "../../../resources/audio/gun-shot-2.flac";
import humanHit1 from "../../../resources/audio/human-hit-1.flac";
import humanHit2 from "../../../resources/audio/human-hit-2.flac";
import pop1 from "../../../resources/audio/pop1.flac";
import wallHit1 from "../../../resources/audio/wall-hit-1.flac";
import wallHit2 from "../../../resources/audio/wall-hit-2.flac";
import zombieHit1 from "../../../resources/audio/zombie-hit-1.flac";
import zombieHit2 from "../../../resources/audio/zombie-hit-2.flac";

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

  simonDeath1,
  simonJoinParty1,
  simonTaunt1,
  simonTaunt2,
  simonWorried1,
  simonWorried2,
  simonWorried3,
  simonRelief1,
  simonLookHere1,
  simonLookHere2,
  simonPickupItem1,
  simonPickupItem2,
  simonPickupItem3,
  simonHurt1,
  simonHurt2,
  simonHurt3,
  simonHurt4,
  simonHurt5,
  simonHurt6,
  simonHurt7,
  simonNearDeath2,
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

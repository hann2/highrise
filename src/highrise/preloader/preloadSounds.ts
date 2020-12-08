import wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import pop1 from "../../../resources/audio/misc/pop1.flac";
import swordShing1 from "../../../resources/audio/weapons/sword-shing-1.flac";
import swordShing2 from "../../../resources/audio/weapons/sword-shing-2.flac";
import swordShing3 from "../../../resources/audio/weapons/sword-shing-3.flac";
import swordShing4 from "../../../resources/audio/weapons/sword-shing-4.flac";
import zombieHit1 from "../../../resources/audio/zombie/zombie-hit-1.flac";
import zombieHit2 from "../../../resources/audio/zombie/zombie-hit-2.flac";
import { CHARACTERS } from "../characters/Character";
import { MUSIC_URLS } from "../MusicController";
import { WEAPONS } from "../weapons";

export function getSoundsToPreload(): string[] {
  const urls = new Set<string>([
    // Misc sounds. Probably will/should get lumped in with other stuff later
    pop1,
    wallHit1,
    wallHit2,
    zombieHit1,
    zombieHit2,
    swordShing1,
    swordShing2,
    swordShing3,
    swordShing4,

    ...MUSIC_URLS,
  ]);

  // Characters
  for (const character of CHARACTERS) {
    for (const soundList of Object.values(character.sounds)) {
      for (const sound of soundList) {
        urls.add(sound);
      }
    }
  }

  // Guns
  for (const weapon of WEAPONS) {
    for (const soundList of Object.values(weapon.sounds)) {
      if (soundList) {
        for (const sound of soundList) {
          urls.add(sound);
        }
      }
    }
  }

  return Array.from(urls);
}

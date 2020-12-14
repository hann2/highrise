import snd_elevatorDing from "../../../resources/audio/environment/elevator-ding.flac";
import snd_wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import snd_wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import snd_wallHit3 from "../../../resources/audio/impacts/wall-hit-3.flac";
import snd_wallHit4 from "../../../resources/audio/impacts/wall-hit-4.flac";
import snd_glowStickDrop1 from "../../../resources/audio/misc/ glow-stick-drop-1.flac";
import snd_glowStickDrop2 from "../../../resources/audio/misc/glow-stick-drop-2.flac";
import snd_pop1 from "../../../resources/audio/misc/pop1.flac";
import snd_quarterDrop1 from "../../../resources/audio/misc/quarter-drop-1.flac";
import { CHARACTERS } from "../characters/Character";
import { FLESH_SPLAT_SOUNDS } from "../effects/FleshImpact";
import { GLOWSTICK_SOUNDS } from "../effects/GlowStick";
import { ZOMBIE_SOUNDS } from "../entities/zombie/ZombieVoice";
import { MUSIC_URLS } from "../MusicController";
import { WEAPONS } from "../weapons";

export function getSoundsToPreload(): string[] {
  const urls = new Set<string>([
    // Misc sounds. Probably will/should get lumped in with other stuff later
    snd_elevatorDing,
    snd_glowStickDrop1,
    snd_glowStickDrop2,
    snd_pop1,
    snd_quarterDrop1,
    snd_wallHit1,
    snd_wallHit2,
    snd_wallHit3,
    snd_wallHit4,

    ...FLESH_SPLAT_SOUNDS,
    ...GLOWSTICK_SOUNDS,
    ...MUSIC_URLS,

    ...WEAPONS.map((w) => Object.values(w.sounds).flat()).flat(),
    ...CHARACTERS.map((c) => Object.values(c.sounds).flat()).flat(),
    ...ZOMBIE_SOUNDS.map((z) => Object.values(z).flat()).flat(),
  ]);

  return Array.from(urls);
}

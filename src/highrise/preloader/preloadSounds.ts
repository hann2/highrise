import snd_chainFence from "../../../resources/audio/environment/chain-fence.flac";
import snd_elevatorDing from "../../../resources/audio/environment/elevator-ding.flac";
import snd_elevatorDoorClose from "../../../resources/audio/environment/elevator-door-close.flac";
import snd_elevatorDoorOpen from "../../../resources/audio/environment/elevator-door-open.flac";
import snd_heavySwitch from "../../../resources/audio/environment/heavy-switch.flac";
import snd_lightsClickOn from "../../../resources/audio/environment/lights-click-on.flac";
import snd_powerOn from "../../../resources/audio/environment/power-on.flac";
import snd_wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import snd_wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import snd_wallHit3 from "../../../resources/audio/impacts/wall-hit-3.flac";
import snd_wallHit4 from "../../../resources/audio/impacts/wall-hit-4.flac";
import snd_glowStickDrop1 from "../../../resources/audio/misc/glow-stick-drop-1.flac";
import snd_glowStickDrop2 from "../../../resources/audio/misc/glow-stick-drop-2.flac";
import snd_pop1 from "../../../resources/audio/misc/pop1.flac";
import snd_quarterDrop1 from "../../../resources/audio/misc/quarter-drop-1.flac";
import { CHARACTERS } from "../characters/Character";
import { ENEMY_SOUNDS, ZOMBIE_ATTACK_HIT_SOUNDS } from "../constants/constants";
import { MUSIC_URLS } from "../controllers/MusicController";
import { GLOWSTICK_SOUNDS } from "../effects/GlowStick";
import { SPLAT_SOUNDS } from "../effects/Splat";
import { PIANO_HIT_SOUNDS } from "../environment/furniture-plus/Piano";
import { VENDING_MACHINE_HIT_SOUNDS } from "../environment/furniture-plus/VendingMachine";
import { PUSH_SOUNDS } from "../human/Human";
import { GUNS } from "../weapons/guns/gun-stats/gunStats";
import { WEAPONS } from "../weapons/weapons";

export function getSoundsToPreload(): string[] {
  const urls = new Set<string>([
    // Misc sounds. Probably will/should get lumped in with other stuff later
    snd_elevatorDing,
    snd_elevatorDoorOpen,
    snd_elevatorDoorClose,
    snd_glowStickDrop1,
    snd_glowStickDrop2,
    snd_pop1,
    snd_quarterDrop1,
    snd_wallHit1,
    snd_wallHit2,
    snd_wallHit3,
    snd_wallHit4,
    snd_heavySwitch,
    snd_lightsClickOn,
    snd_powerOn,
    snd_chainFence,

    ...PIANO_HIT_SOUNDS,
    ...VENDING_MACHINE_HIT_SOUNDS,
    ...ZOMBIE_ATTACK_HIT_SOUNDS,
    ...PUSH_SOUNDS,
    ...SPLAT_SOUNDS,
    ...GLOWSTICK_SOUNDS,
    ...MUSIC_URLS,

    ...WEAPONS.map((w) => Object.values(w.sounds).flat()).flat(),
    ...GUNS.map((g) => g.bulletStats.dropSounds).flat(),
    ...CHARACTERS.map((c) => Object.values(c.sounds).flat()).flat(),
    ...ENEMY_SOUNDS.map((z) => Object.values(z).flat()).flat(),
  ]);

  return Array.from(urls);
}

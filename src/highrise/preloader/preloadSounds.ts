import snd_elevatorDing from "../../../resources/audio/environment/elevator-ding.flac";
import snd_elevatorDoorClose from "../../../resources/audio/environment/elevator-door-close.flac";
import snd_elevatorDoorOpen from "../../../resources/audio/environment/elevator-door-open.flac";
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
import * as DECORATION_INFOS from "../environment/decorations/decorations";
import { VENDING_MACHINE_HIT_SOUNDS } from "../environment/furniture-plus/VendingMachine";
import { MACHINE_SOUNDS } from "../environment/lighting/LightSwitch";
import { WALL_TYPES } from "../environment/WallTypes";
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

    ...MACHINE_SOUNDS,
    ...WALL_TYPES.flatMap((wallType) => wallType.collisionSounds ?? []),
    ...WALL_TYPES.flatMap((wallType) => wallType.impactSounds ?? []),
    ...Object.values(DECORATION_INFOS).flatMap((info) => info.hitSounds ?? []),
    ...VENDING_MACHINE_HIT_SOUNDS,
    ...ZOMBIE_ATTACK_HIT_SOUNDS,
    ...PUSH_SOUNDS,
    ...SPLAT_SOUNDS,
    ...GLOWSTICK_SOUNDS,
    ...MUSIC_URLS,

    ...WEAPONS.flatMap((weapon) => Object.values(weapon.sounds).flat()),
    ...GUNS.flatMap((gun) => gun.bulletStats.dropSounds),
    ...CHARACTERS.flatMap((character) =>
      Object.values(character.sounds).flat()
    ),
    ...ENEMY_SOUNDS.flatMap((enemySounds) => Object.values(enemySounds).flat()),
  ]);

  return Array.from(urls);
}

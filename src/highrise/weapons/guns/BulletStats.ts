import snd_casingDropBoard1 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-1.flac";
import snd_casingDropBoard2 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-2.flac";
import snd_casingDropBoard3 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-3.flac";
import snd_casingDropBoard4 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-4.flac";
import img_pistolCasing from "../../../../resources/images/shell-casings/pistol-casing.png";
import { SoundName } from "../../../core/resources/sounds";

export interface BulletStats {
  // Amount of damage done to
  damage: number;
  // Speed in meters/sec this exits the gun
  muzzleVelocity: number;
  // Color of the line
  color: number;
  // Sound the casing makes when it hits the ground
  dropSounds: SoundName[];
  // Texture of the casing as it's flying and hitting the ground
  dropTexture: string;
}

export const defaultBulletStats: BulletStats = {
  damage: 10,
  muzzleVelocity: 100,
  color: 0xff9900,
  dropSounds: [
    snd_casingDropBoard1,
    snd_casingDropBoard2,
    snd_casingDropBoard3,
    snd_casingDropBoard4,
  ],
  dropTexture: img_pistolCasing,
};

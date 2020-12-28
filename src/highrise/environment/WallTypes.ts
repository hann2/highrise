import snd_chainLinkFence1 from "../../../resources/audio/environment/chain-link-fence-1.flac";
import snd_chainLinkFence2 from "../../../resources/audio/environment/chain-link-fence-2.flac";
import snd_chainLinkFence3 from "../../../resources/audio/environment/chain-link-fence-3.flac";
import snd_wallHit3 from "../../../resources/audio/impacts/wall-hit-3.flac";
import img_chainLinkFence from "../../../resources/images/environment/chain-link-fence.png";
import img_wall1 from "../../../resources/images/environment/wall-1.png";
import { SoundName } from "../../core/resources/sounds";

export interface WallType {
  // Whether or not this stops bullets from going through
  blocksBullets: boolean;
  // Whether or not this stops creatures (humans, zombies) from going through
  blocksMovement: boolean;
  // Whether or not this stops vision
  blocksVision: boolean;
  // Whether or not this casts a shadow
  castsShadow: boolean;

  // Tint to apply to the image. Defaults to white
  color?: number;
  // Url for the sprite to use
  imageUrl: string;

  // Width in meters to draw the sprite
  spriteWidth: number;
  // Width in meters to make the physics body
  collisionWidth: number;

  // Sound when someone runs into it
  collisionSounds?: SoundName[];
  // Sound when a bullet hits it
  impactSounds?: SoundName[];
}

// A regular solid wall
export const SolidWall: WallType = {
  blocksBullets: true,
  blocksMovement: true,
  blocksVision: true,
  castsShadow: true,

  impactSounds: [snd_wallHit3],
  color: 0x999999,
  imageUrl: img_wall1,
  collisionWidth: 0.15,
  spriteWidth: 0.75,
};

// A regular solid wall
export const BathroomWall: WallType = {
  blocksBullets: true,
  blocksMovement: true,
  blocksVision: true,
  castsShadow: true,

  impactSounds: [snd_wallHit3],
  color: 0x999999,
  imageUrl: img_wall1,
  collisionWidth: 0.1,
  spriteWidth: 0.3,
};

// A chain link fence
export const ChainLinkFence: WallType = {
  blocksBullets: false,
  blocksMovement: true,
  blocksVision: false,
  castsShadow: false,

  collisionSounds: [
    snd_chainLinkFence1,
    snd_chainLinkFence2,
    snd_chainLinkFence3,
  ],
  color: 0xffffff,
  imageUrl: img_chainLinkFence,
  collisionWidth: 0.15,
  spriteWidth: 0.225,
};

export const WALL_TYPES = [SolidWall, BathroomWall, ChainLinkFence];

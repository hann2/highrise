import { SoundName } from "../../../resources/resources";

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

  impactSounds: ["wallHit3"],
  color: 0x999999,
  imageUrl: "wall1",
  collisionWidth: 0.15,
  spriteWidth: 0.75,
};

// A regular solid wall
export const BathroomWall: WallType = {
  blocksBullets: true,
  blocksMovement: true,
  blocksVision: false,
  castsShadow: false,

  impactSounds: ["wallHit3"],
  color: 0x999999,
  imageUrl: "wall1",
  collisionWidth: 0.1,
  spriteWidth: 0.3,
};

// A chain link fence
export const ChainLinkFence: WallType = {
  blocksBullets: false,
  blocksMovement: true,
  blocksVision: false,
  castsShadow: false,

  collisionSounds: ["chainLinkFence1", "chainLinkFence2", "chainLinkFence3"],
  color: 0xffffff,
  imageUrl: "chainLinkFence",
  collisionWidth: 0.15,
  spriteWidth: 0.225,
};

export const WALL_TYPES = [SolidWall, BathroomWall, ChainLinkFence];

// This file exists to avoid circular dependencies causing imports to return as undefined
// SO DON'T PUT ANY IMPORTS IN THIS FILE

import img_zombieHead1 from "../../resources/images/zombies/zombie-head-1.png";
import img_zombieHead2 from "../../resources/images/zombies/zombie-head-2.png";
import img_zombieHead3 from "../../resources/images/zombies/zombie-head-3.png";
import img_zombieLeftArm1 from "../../resources/images/zombies/zombie-left-arm-1.png";
import img_zombieLeftArm2 from "../../resources/images/zombies/zombie-left-arm-2.png";
import img_zombieLeftArm3 from "../../resources/images/zombies/zombie-left-arm-3.png";
import img_zombieLeftHand1 from "../../resources/images/zombies/zombie-left-hand-1.png";
import img_zombieLeftHand2 from "../../resources/images/zombies/zombie-left-hand-2.png";
import img_zombieLeftHand3 from "../../resources/images/zombies/zombie-left-hand-3.png";
import img_zombieRightArm1 from "../../resources/images/zombies/zombie-right-arm-1.png";
import img_zombieRightArm2 from "../../resources/images/zombies/zombie-right-arm-2.png";
import img_zombieRightArm3 from "../../resources/images/zombies/zombie-right-arm-3.png";
import img_zombieRightHand1 from "../../resources/images/zombies/zombie-right-hand-1.png";
import img_zombieRightHand2 from "../../resources/images/zombies/zombie-right-hand-2.png";
import img_zombieRightHand3 from "../../resources/images/zombies/zombie-right-hand-3.png";
import img_zombieTorso1 from "../../resources/images/zombies/zombie-torso-1.png";
import img_zombieTorso2 from "../../resources/images/zombies/zombie-torso-2.png";
import img_zombieTorso3 from "../../resources/images/zombies/zombie-torso-3.png";
import { BodyTextures } from "./creature-stuff/BodySprite";

// Radius of a zombie in meters
export const ZOMBIE_RADIUS = 0.35; // meters

// Radius of a human in meters
export const HUMAN_RADIUS = 0.35; // meters

export const ZOMBIE_TEXTURES: BodyTextures[] = [
  {
    torso: img_zombieTorso1,
    head: img_zombieHead1,
    leftArm: img_zombieLeftArm1,
    rightArm: img_zombieRightArm1,
    leftHand: img_zombieLeftHand1,
    rightHand: img_zombieRightHand1,
  },
  {
    torso: img_zombieTorso2,
    head: img_zombieHead2,
    leftArm: img_zombieLeftArm2,
    rightArm: img_zombieRightArm2,
    leftHand: img_zombieLeftHand2,
    rightHand: img_zombieRightHand2,
  },
  {
    torso: img_zombieTorso3,
    head: img_zombieHead3,
    leftArm: img_zombieLeftArm3,
    rightArm: img_zombieRightArm3,
    leftHand: img_zombieLeftHand3,
    rightHand: img_zombieRightHand3,
  },
];

import snd_simonDeath1 from "../../../resources/audio/characters/simon/simon-death-1.flac";
import snd_simonHurt1 from "../../../resources/audio/characters/simon/simon-hurt-1.flac";
import snd_simonHurt2 from "../../../resources/audio/characters/simon/simon-hurt-2.flac";
import snd_simonHurt3 from "../../../resources/audio/characters/simon/simon-hurt-3.flac";
import snd_simonHurt4 from "../../../resources/audio/characters/simon/simon-hurt-4.flac";
import snd_simonHurt5 from "../../../resources/audio/characters/simon/simon-hurt-5.flac";
import snd_simonHurt6 from "../../../resources/audio/characters/simon/simon-hurt-6.flac";
import snd_simonHurt7 from "../../../resources/audio/characters/simon/simon-hurt-7.flac";
import snd_simonJoinParty1 from "../../../resources/audio/characters/simon/simon-join-party-1.flac";
import snd_simonLookHere1 from "../../../resources/audio/characters/simon/simon-look-here-1.flac";
import snd_simonLookHere2 from "../../../resources/audio/characters/simon/simon-look-here-2.flac";
import snd_simonNearDeath2 from "../../../resources/audio/characters/simon/simon-near-death-2.flac";
import snd_simonPickupItem1 from "../../../resources/audio/characters/simon/simon-pickup-item-1.flac";
import snd_simonPickupItem2 from "../../../resources/audio/characters/simon/simon-pickup-item-2.flac";
import snd_simonPickupItem3 from "../../../resources/audio/characters/simon/simon-pickup-item-3.flac";
import snd_simonRelief1 from "../../../resources/audio/characters/simon/simon-relief-1.flac";
import snd_simonTaunt1 from "../../../resources/audio/characters/simon/simon-taunt-1.flac";
import snd_simonTaunt2 from "../../../resources/audio/characters/simon/simon-taunt-2.flac";
import snd_simonWorried1 from "../../../resources/audio/characters/simon/simon-worried-1.flac";
import snd_simonWorried2 from "../../../resources/audio/characters/simon/simon-worried-2.flac";
import snd_simonWorried3 from "../../../resources/audio/characters/simon/simon-worried-3.flac";
import img_simonHead from "../../../resources/images/characters/simon-head.png";
import img_simonLeftArm from "../../../resources/images/characters/simon-left-arm.png";
import img_simonLeftHand from "../../../resources/images/characters/simon-left-hand.png";
import img_simonRightArm from "../../../resources/images/characters/simon-right-arm.png";
import img_simonRightHand from "../../../resources/images/characters/simon-right-hand.png";
import img_simonTorso from "../../../resources/images/characters/simon-torso.png";
import { Character } from "./Character";

export const Simon: Character = {
  textures: {
    head: img_simonHead,
    leftArm: img_simonLeftArm,
    leftHand: img_simonLeftHand,
    rightArm: img_simonRightArm,
    rightHand: img_simonRightHand,
    torso: img_simonTorso,
  },

  sounds: {
    death: [snd_simonDeath1],
    hurt: [
      snd_simonHurt1,
      snd_simonHurt2,
      snd_simonHurt3,
      snd_simonHurt4,
      snd_simonHurt5,
      snd_simonHurt6,
      snd_simonHurt7,
    ],
    joinParty: [snd_simonJoinParty1],
    lookHere: [snd_simonLookHere1, snd_simonLookHere2],
    misc: [], // TODO: snd_simon misc
    nearDeath: [snd_simonNearDeath2],
    newLevel: [], // TODO: snd_simon newLevel
    pickupItem: [
      snd_simonPickupItem1,
      snd_simonPickupItem2,
      snd_simonPickupItem3,
    ],
    pickupGun: [
      snd_simonPickupItem1,
      snd_simonPickupItem2,
      snd_simonPickupItem3,
    ],
    pickupMelee: [
      snd_simonPickupItem1,
      snd_simonPickupItem2,
      snd_simonPickupItem3,
    ],
    pickupHealth: [
      snd_simonPickupItem1,
      snd_simonPickupItem2,
      snd_simonPickupItem3,
    ],
    relief: [snd_simonRelief1],
    taunts: [snd_simonTaunt1, snd_simonTaunt2],
    worried: [snd_simonWorried1, snd_simonWorried2, snd_simonWorried3],
  },
};

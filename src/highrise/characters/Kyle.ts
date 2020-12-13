import kyleDeath1 from "../../../resources/audio/characters/kyle/kyle-death-1.flac";
import kyleDeath2 from "../../../resources/audio/characters/kyle/kyle-death-2.flac";
import kyleDeath3 from "../../../resources/audio/characters/kyle/kyle-death-3.flac";
import kyleHurt1 from "../../../resources/audio/characters/kyle/kyle-hurt-1.flac";
import kyleHurt2 from "../../../resources/audio/characters/kyle/kyle-hurt-2.flac";
import kyleHurt3 from "../../../resources/audio/characters/kyle/kyle-hurt-3.flac";
import kyleHurt4 from "../../../resources/audio/characters/kyle/kyle-hurt-4.flac";
import kyleHurt5 from "../../../resources/audio/characters/kyle/kyle-hurt-5.flac";
import kyleHurt6 from "../../../resources/audio/characters/kyle/kyle-hurt-6.flac";
import kyleHurt7 from "../../../resources/audio/characters/kyle/kyle-hurt-7.flac";
import kyleHurt8 from "../../../resources/audio/characters/kyle/kyle-hurt-8.flac";
import kyleHurt9 from "../../../resources/audio/characters/kyle/kyle-hurt-9.flac";
import kyleJoinParty1 from "../../../resources/audio/characters/kyle/kyle-join-party-1.flac";
import kyleLookHere1 from "../../../resources/audio/characters/kyle/kyle-look-here-1.flac";
import kyleLookHere2 from "../../../resources/audio/characters/kyle/kyle-look-here-2.flac";
import kyleNearDeath1 from "../../../resources/audio/characters/kyle/kyle-near-death-1.flac";
import kyleNearDeath2 from "../../../resources/audio/characters/kyle/kyle-near-death-2.flac";
import kyleNewLevel1 from "../../../resources/audio/characters/kyle/kyle-new-level-1.flac";
import kylePickup1 from "../../../resources/audio/characters/kyle/kyle-pickup-1.flac";
import kylePickup2 from "../../../resources/audio/characters/kyle/kyle-pickup-2.flac";
import kyleRelief1 from "../../../resources/audio/characters/kyle/kyle-relief-1.flac";
import kyleTaunt1 from "../../../resources/audio/characters/kyle/kyle-taunt-1.flac";
import kyleWorried1 from "../../../resources/audio/characters/kyle/kyle-worried-1.flac";
import kyleWorried2 from "../../../resources/audio/characters/kyle/kyle-worried-2.flac";
import kyleWorried3 from "../../../resources/audio/characters/kyle/kyle-worried-3.flac";
import kyleHead from "../../../resources/images/characters/kyle-head.png";
import kyleLeftArm from "../../../resources/images/characters/kyle-left-arm.png";
import kyleLeftHand from "../../../resources/images/characters/kyle-left-hand.png";
import kyleRightArm from "../../../resources/images/characters/kyle-right-arm.png";
import kyleRightHand from "../../../resources/images/characters/kyle-right-hand.png";
import kyleTorso from "../../../resources/images/characters/kyle-torso.png";
import { Character } from "./Character";

export const Kyle: Character = {
  textures: {
    head: kyleHead,
    leftArm: kyleLeftArm,
    leftHand: kyleLeftHand,
    rightArm: kyleRightArm,
    rightHand: kyleRightHand,
    torso: kyleTorso,
  },

  sounds: {
    death: [kyleDeath1, kyleDeath2, kyleDeath3],
    hurt: [
      kyleHurt1,
      kyleHurt2,
      kyleHurt3,
      kyleHurt4,
      kyleHurt5,
      kyleHurt6,
      kyleHurt7,
      kyleHurt8,
      kyleHurt9,
    ],
    joinParty: [kyleJoinParty1],
    lookHere: [kyleLookHere1, kyleLookHere2],
    misc: [],
    nearDeath: [kyleNearDeath1, kyleNearDeath2],
    newLevel: [kyleNewLevel1],
    pickupItem: [kylePickup1, kylePickup2],
    relief: [kyleRelief1],
    taunts: [kyleTaunt1],
    worried: [kyleWorried1, kyleWorried2, kyleWorried3],
  },
};

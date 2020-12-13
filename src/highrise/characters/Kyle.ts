import snd_kyleDeath1 from "../../../resources/audio/characters/kyle/kyle-death-1.flac";
import snd_kyleDeath2 from "../../../resources/audio/characters/kyle/kyle-death-2.flac";
import snd_kyleDeath3 from "../../../resources/audio/characters/kyle/kyle-death-3.flac";
import snd_kyleHurt1 from "../../../resources/audio/characters/kyle/kyle-hurt-1.flac";
import snd_kyleHurt2 from "../../../resources/audio/characters/kyle/kyle-hurt-2.flac";
import snd_kyleHurt3 from "../../../resources/audio/characters/kyle/kyle-hurt-3.flac";
import snd_kyleHurt4 from "../../../resources/audio/characters/kyle/kyle-hurt-4.flac";
import snd_kyleHurt5 from "../../../resources/audio/characters/kyle/kyle-hurt-5.flac";
import snd_kyleHurt6 from "../../../resources/audio/characters/kyle/kyle-hurt-6.flac";
import snd_kyleHurt7 from "../../../resources/audio/characters/kyle/kyle-hurt-7.flac";
import snd_kyleHurt8 from "../../../resources/audio/characters/kyle/kyle-hurt-8.flac";
import snd_kyleHurt9 from "../../../resources/audio/characters/kyle/kyle-hurt-9.flac";
import snd_kyleJoinParty1 from "../../../resources/audio/characters/kyle/kyle-join-party-1.flac";
import snd_kyleLookHere1 from "../../../resources/audio/characters/kyle/kyle-look-here-1.flac";
import snd_kyleLookHere2 from "../../../resources/audio/characters/kyle/kyle-look-here-2.flac";
import snd_kyleNearDeath1 from "../../../resources/audio/characters/kyle/kyle-near-death-1.flac";
import snd_kyleNearDeath2 from "../../../resources/audio/characters/kyle/kyle-near-death-2.flac";
import snd_kyleNewLevel1 from "../../../resources/audio/characters/kyle/kyle-new-level-1.flac";
import snd_kylePickup1 from "../../../resources/audio/characters/kyle/kyle-pickup-1.flac";
import snd_kylePickup2 from "../../../resources/audio/characters/kyle/kyle-pickup-2.flac";
import snd_kyleRelief1 from "../../../resources/audio/characters/kyle/kyle-relief-1.flac";
import snd_kyleTaunt1 from "../../../resources/audio/characters/kyle/kyle-taunt-1.flac";
import snd_kyleWorried1 from "../../../resources/audio/characters/kyle/kyle-worried-1.flac";
import snd_kyleWorried2 from "../../../resources/audio/characters/kyle/kyle-worried-2.flac";
import snd_kyleWorried3 from "../../../resources/audio/characters/kyle/kyle-worried-3.flac";
import img_kyleHead from "../../../resources/images/characters/kyle-head.png";
import img_kyleLeftArm from "../../../resources/images/characters/kyle-left-arm.png";
import img_kyleLeftHand from "../../../resources/images/characters/kyle-left-hand.png";
import img_kyleRightArm from "../../../resources/images/characters/kyle-right-arm.png";
import img_kyleRightHand from "../../../resources/images/characters/kyle-right-hand.png";
import img_kyleTorso from "../../../resources/images/characters/kyle-torso.png";
import { Character } from "./Character";

export const Kyle: Character = {
  textures: {
    head: img_kyleHead,
    leftArm: img_kyleLeftArm,
    leftHand: img_kyleLeftHand,
    rightArm: img_kyleRightArm,
    rightHand: img_kyleRightHand,
    torso: img_kyleTorso,
  },

  sounds: {
    death: [snd_kyleDeath1, snd_kyleDeath2, snd_kyleDeath3],
    hurt: [
      snd_kyleHurt1,
      snd_kyleHurt2,
      snd_kyleHurt3,
      snd_kyleHurt4,
      snd_kyleHurt5,
      snd_kyleHurt6,
      snd_kyleHurt7,
      snd_kyleHurt8,
      snd_kyleHurt9,
    ],
    joinParty: [snd_kyleJoinParty1],
    lookHere: [snd_kyleLookHere1, snd_kyleLookHere2],
    misc: [],
    nearDeath: [snd_kyleNearDeath1, snd_kyleNearDeath2],
    newLevel: [snd_kyleNewLevel1],
    pickupItem: [snd_kylePickup1, snd_kylePickup2],
    pickupGun: [snd_kylePickup1, snd_kylePickup2],
    pickupMelee: [snd_kylePickup1, snd_kylePickup2],
    pickupHealth: [snd_kylePickup1, snd_kylePickup2],
    relief: [snd_kyleRelief1],
    taunts: [snd_kyleTaunt1],
    worried: [snd_kyleWorried1, snd_kyleWorried2, snd_kyleWorried3],
  },
};

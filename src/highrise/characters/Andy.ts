import snd_andyDeath1 from "../../../resources/audio/characters/andy/andy-death-1.flac";
import snd_andyDeath2 from "../../../resources/audio/characters/andy/andy-death-2.flac";
import snd_andyDeath3 from "../../../resources/audio/characters/andy/andy-death-3.flac";
import snd_andyDeath4 from "../../../resources/audio/characters/andy/andy-death-4.flac";
import snd_andyHurt1 from "../../../resources/audio/characters/andy/andy-hurt-1.flac";
import snd_andyHurt2 from "../../../resources/audio/characters/andy/andy-hurt-2.flac";
import snd_andyHurt3 from "../../../resources/audio/characters/andy/andy-hurt-3.flac";
import snd_andyHurt4 from "../../../resources/audio/characters/andy/andy-hurt-4.flac";
import snd_andyHurt5 from "../../../resources/audio/characters/andy/andy-hurt-5.flac";
import snd_andyHurt6 from "../../../resources/audio/characters/andy/andy-hurt-6.flac";
import snd_andyHurt7 from "../../../resources/audio/characters/andy/andy-hurt-7.flac";
import snd_andyHurt8 from "../../../resources/audio/characters/andy/andy-hurt-8.flac";
import snd_andyJoinParty1 from "../../../resources/audio/characters/andy/andy-join-party-1.flac";
import snd_andyJoinParty2 from "../../../resources/audio/characters/andy/andy-join-party-2.flac";
import snd_andyJoinParty3 from "../../../resources/audio/characters/andy/andy-join-party-3.flac";
import snd_andyLookHere1 from "../../../resources/audio/characters/andy/andy-look-here-1.flac";
import snd_andyLookHere2 from "../../../resources/audio/characters/andy/andy-look-here-2.flac";
import snd_andyMisc1 from "../../../resources/audio/characters/andy/andy-misc-1.flac";
import snd_andyMisc2 from "../../../resources/audio/characters/andy/andy-misc-2.flac";
import snd_andyMisc3 from "../../../resources/audio/characters/andy/andy-misc-3.flac";
import snd_andyNearDeath1 from "../../../resources/audio/characters/andy/andy-near-death-1.flac";
import snd_andyNearDeath2 from "../../../resources/audio/characters/andy/andy-near-death-2.flac";
import snd_andyNearDeath3 from "../../../resources/audio/characters/andy/andy-near-death-3.flac";
import snd_andyNearDeath4 from "../../../resources/audio/characters/andy/andy-near-death-4.flac";
import snd_andyNewLevel1 from "../../../resources/audio/characters/andy/andy-new-level-1.flac";
import snd_andyNewLevel2 from "../../../resources/audio/characters/andy/andy-new-level-2.flac";
import snd_andyPickup1 from "../../../resources/audio/characters/andy/andy-pickup-1.flac";
import snd_andyPickup2 from "../../../resources/audio/characters/andy/andy-pickup-2.flac";
import snd_andyPickup3 from "../../../resources/audio/characters/andy/andy-pickup-3.flac";
import snd_andyPickup4 from "../../../resources/audio/characters/andy/andy-pickup-4.flac";
import snd_andyPickup5 from "../../../resources/audio/characters/andy/andy-pickup-5.flac";
import snd_andyRelief1 from "../../../resources/audio/characters/andy/andy-relief-1.flac";
import snd_andyRelief2 from "../../../resources/audio/characters/andy/andy-relief-2.flac";
import snd_andyRelief3 from "../../../resources/audio/characters/andy/andy-relief-3.flac";
import snd_andyRelief4 from "../../../resources/audio/characters/andy/andy-relief-4.flac";
import snd_andyRelief5 from "../../../resources/audio/characters/andy/andy-relief-5.flac";
import snd_andyRelief6 from "../../../resources/audio/characters/andy/andy-relief-6.flac";
import snd_andyTaunt1 from "../../../resources/audio/characters/andy/andy-taunt-1.flac";
import snd_andyTaunt2 from "../../../resources/audio/characters/andy/andy-taunt-2.flac";
import snd_andyWorried1 from "../../../resources/audio/characters/andy/andy-worried-1.flac";
import snd_andyWorried2 from "../../../resources/audio/characters/andy/andy-worried-2.flac";
import snd_andyWorried3 from "../../../resources/audio/characters/andy/andy-worried-3.flac";
import snd_andyWorried4 from "../../../resources/audio/characters/andy/andy-worried-4.flac";
import snd_andyWorried5 from "../../../resources/audio/characters/andy/andy-worried-5.flac";
import img_andyHead from "../../../resources/images/characters/andy-head.png";
import img_andyLeftArm from "../../../resources/images/characters/andy-left-arm.png";
import img_andyLeftHand from "../../../resources/images/characters/andy-left-hand.png";
import img_andyRightArm from "../../../resources/images/characters/andy-right-arm.png";
import img_andyRightHand from "../../../resources/images/characters/andy-right-hand.png";
import img_andyTorso from "../../../resources/images/characters/andy-torso.png";
import { Character } from "./Character";

export const Andy: Character = {
  textures: {
    head: img_andyHead,
    leftArm: img_andyLeftArm,
    leftHand: img_andyLeftHand,
    rightArm: img_andyRightArm,
    rightHand: img_andyRightHand,
    torso: img_andyTorso,
  },

  sounds: {
    death: [snd_andyDeath1, snd_andyDeath2, snd_andyDeath3, snd_andyDeath4],
    hurt: [
      snd_andyHurt1,
      snd_andyHurt2,
      snd_andyHurt3,
      snd_andyHurt4,
      snd_andyHurt5,
      snd_andyHurt6,
      snd_andyHurt7,
      snd_andyHurt8,
    ],
    joinParty: [snd_andyJoinParty1, snd_andyJoinParty2, snd_andyJoinParty3],
    lookHere: [snd_andyLookHere1, snd_andyLookHere2],
    misc: [snd_andyMisc1, snd_andyMisc2, snd_andyMisc3],
    nearDeath: [
      snd_andyNearDeath1,
      snd_andyNearDeath2,
      snd_andyNearDeath3,
      snd_andyNearDeath4,
    ],
    newLevel: [snd_andyNewLevel1, snd_andyNewLevel2],
    pickupItem: [
      snd_andyPickup1,
      snd_andyPickup2,
      snd_andyPickup3,
      snd_andyPickup4,
      snd_andyPickup5,
    ],
    pickupGun: [
      snd_andyPickup1,
      snd_andyPickup2,
      snd_andyPickup3,
      snd_andyPickup4,
      snd_andyPickup5,
    ],
    pickupMelee: [
      snd_andyPickup1,
      snd_andyPickup2,
      snd_andyPickup3,
      snd_andyPickup4,
      snd_andyPickup5,
    ],
    pickupHealth: [
      snd_andyPickup1,
      snd_andyPickup2,
      snd_andyPickup3,
      snd_andyPickup4,
      snd_andyPickup5,
    ],
    relief: [
      snd_andyRelief1,
      snd_andyRelief2,
      snd_andyRelief3,
      snd_andyRelief4,
      snd_andyRelief5,
      snd_andyRelief6,
    ],
    taunts: [snd_andyTaunt1, snd_andyTaunt2],
    worried: [
      snd_andyWorried1,
      snd_andyWorried2,
      snd_andyWorried3,
      snd_andyWorried4,
      snd_andyWorried5,
    ],
  },
};

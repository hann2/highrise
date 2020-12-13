import andyDeath1 from "../../../resources/audio/characters/andy/andy-death-1.flac";
import andyDeath2 from "../../../resources/audio/characters/andy/andy-death-2.flac";
import andyDeath3 from "../../../resources/audio/characters/andy/andy-death-3.flac";
import andyDeath4 from "../../../resources/audio/characters/andy/andy-death-4.flac";
import andyHurt1 from "../../../resources/audio/characters/andy/andy-hurt-1.flac";
import andyHurt2 from "../../../resources/audio/characters/andy/andy-hurt-2.flac";
import andyHurt3 from "../../../resources/audio/characters/andy/andy-hurt-3.flac";
import andyHurt4 from "../../../resources/audio/characters/andy/andy-hurt-4.flac";
import andyHurt5 from "../../../resources/audio/characters/andy/andy-hurt-5.flac";
import andyHurt6 from "../../../resources/audio/characters/andy/andy-hurt-6.flac";
import andyHurt7 from "../../../resources/audio/characters/andy/andy-hurt-7.flac";
import andyHurt8 from "../../../resources/audio/characters/andy/andy-hurt-8.flac";
import andyJoinParty1 from "../../../resources/audio/characters/andy/andy-join-party-1.flac";
import andyJoinParty2 from "../../../resources/audio/characters/andy/andy-join-party-2.flac";
import andyJoinParty3 from "../../../resources/audio/characters/andy/andy-join-party-3.flac";
import andyLookHere1 from "../../../resources/audio/characters/andy/andy-look-here-1.flac";
import andyLookHere2 from "../../../resources/audio/characters/andy/andy-look-here-2.flac";
import andyMisc1 from "../../../resources/audio/characters/andy/andy-misc-1.flac";
import andyMisc2 from "../../../resources/audio/characters/andy/andy-misc-2.flac";
import andyMisc3 from "../../../resources/audio/characters/andy/andy-misc-3.flac";
import andyNearDeath1 from "../../../resources/audio/characters/andy/andy-near-death-1.flac";
import andyNearDeath2 from "../../../resources/audio/characters/andy/andy-near-death-2.flac";
import andyNearDeath3 from "../../../resources/audio/characters/andy/andy-near-death-3.flac";
import andyNearDeath4 from "../../../resources/audio/characters/andy/andy-near-death-4.flac";
import andyNewLevel1 from "../../../resources/audio/characters/andy/andy-new-level-1.flac";
import andyNewLevel2 from "../../../resources/audio/characters/andy/andy-new-level-2.flac";
import andyPickup1 from "../../../resources/audio/characters/andy/andy-pickup-1.flac";
import andyPickup2 from "../../../resources/audio/characters/andy/andy-pickup-2.flac";
import andyPickup3 from "../../../resources/audio/characters/andy/andy-pickup-3.flac";
import andyPickup4 from "../../../resources/audio/characters/andy/andy-pickup-4.flac";
import andyPickup5 from "../../../resources/audio/characters/andy/andy-pickup-5.flac";
import andyRelief1 from "../../../resources/audio/characters/andy/andy-relief-1.flac";
import andyRelief2 from "../../../resources/audio/characters/andy/andy-relief-2.flac";
import andyRelief3 from "../../../resources/audio/characters/andy/andy-relief-3.flac";
import andyRelief4 from "../../../resources/audio/characters/andy/andy-relief-4.flac";
import andyRelief5 from "../../../resources/audio/characters/andy/andy-relief-5.flac";
import andyRelief6 from "../../../resources/audio/characters/andy/andy-relief-6.flac";
import andyTaunt1 from "../../../resources/audio/characters/andy/andy-taunt-1.flac";
import andyTaunt2 from "../../../resources/audio/characters/andy/andy-taunt-2.flac";
import andyWorried1 from "../../../resources/audio/characters/andy/andy-worried-1.flac";
import andyWorried2 from "../../../resources/audio/characters/andy/andy-worried-2.flac";
import andyWorried3 from "../../../resources/audio/characters/andy/andy-worried-3.flac";
import andyWorried4 from "../../../resources/audio/characters/andy/andy-worried-4.flac";
import andyWorried5 from "../../../resources/audio/characters/andy/andy-worried-5.flac";
import andyHead from "../../../resources/images/characters/andy-head.png";
import andyLeftArm from "../../../resources/images/characters/andy-left-arm.png";
import andyLeftHand from "../../../resources/images/characters/andy-left-hand.png";
import andyRightArm from "../../../resources/images/characters/andy-right-arm.png";
import andyRightHand from "../../../resources/images/characters/andy-right-hand.png";
import andyTorso from "../../../resources/images/characters/andy-torso.png";
import { Character } from "./Character";

export const Andy: Character = {
  textures: {
    head: andyHead,
    leftArm: andyLeftArm,
    leftHand: andyLeftHand,
    rightArm: andyRightArm,
    rightHand: andyRightHand,
    torso: andyTorso,
  },

  sounds: {
    death: [andyDeath1, andyDeath2, andyDeath3, andyDeath4],
    hurt: [
      andyHurt1,
      andyHurt2,
      andyHurt3,
      andyHurt4,
      andyHurt5,
      andyHurt6,
      andyHurt7,
      andyHurt8,
    ],
    joinParty: [andyJoinParty1, andyJoinParty2, andyJoinParty3],
    lookHere: [andyLookHere1, andyLookHere2],
    misc: [andyMisc1, andyMisc2, andyMisc3],
    nearDeath: [andyNearDeath1, andyNearDeath2, andyNearDeath3, andyNearDeath4],
    newLevel: [andyNewLevel1, andyNewLevel2],
    pickupItem: [
      andyPickup1,
      andyPickup2,
      andyPickup3,
      andyPickup4,
      andyPickup5,
    ],
    pickupGun: [
      andyPickup1,
      andyPickup2,
      andyPickup3,
      andyPickup4,
      andyPickup5,
    ],
    pickupMelee: [
      andyPickup1,
      andyPickup2,
      andyPickup3,
      andyPickup4,
      andyPickup5,
    ],
    pickupHealth: [
      andyPickup1,
      andyPickup2,
      andyPickup3,
      andyPickup4,
      andyPickup5,
    ],
    relief: [
      andyRelief1,
      andyRelief2,
      andyRelief3,
      andyRelief4,
      andyRelief5,
      andyRelief6,
    ],
    taunts: [andyTaunt1, andyTaunt2],
    worried: [
      andyWorried1,
      andyWorried2,
      andyWorried3,
      andyWorried4,
      andyWorried5,
    ],
  },
};

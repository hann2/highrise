import snd_wendyDeath1 from "../../../resources/audio/characters/wendy/wendy-death-1.flac";
import snd_wendyDeath2 from "../../../resources/audio/characters/wendy/wendy-death-2.flac";
import snd_wendyDeath3 from "../../../resources/audio/characters/wendy/wendy-death-3.flac";
import snd_wendyDeath4 from "../../../resources/audio/characters/wendy/wendy-death-4.flac";
import snd_wendyHurt1 from "../../../resources/audio/characters/wendy/wendy-hurt-1.flac";
import snd_wendyHurt2 from "../../../resources/audio/characters/wendy/wendy-hurt-2.flac";
import snd_wendyHurt3 from "../../../resources/audio/characters/wendy/wendy-hurt-3.flac";
import snd_wendyHurt4 from "../../../resources/audio/characters/wendy/wendy-hurt-4.flac";
import snd_wendyHurt6 from "../../../resources/audio/characters/wendy/wendy-hurt-6.flac";
import snd_wendyHurt7 from "../../../resources/audio/characters/wendy/wendy-hurt-7.flac";
import snd_wendyJoinParty1 from "../../../resources/audio/characters/wendy/wendy-join-party-1.flac";
import snd_wendyJoinParty2 from "../../../resources/audio/characters/wendy/wendy-join-party-2.flac";
import snd_wendyJoinParty3 from "../../../resources/audio/characters/wendy/wendy-join-party-3.flac";
import snd_wendyJoinParty4 from "../../../resources/audio/characters/wendy/wendy-join-party-4.flac";
import snd_wendyLookHere1 from "../../../resources/audio/characters/wendy/wendy-look-here-1.flac";
import snd_wendyLookHere2 from "../../../resources/audio/characters/wendy/wendy-look-here-2.flac";
import snd_wendyLookHere3 from "../../../resources/audio/characters/wendy/wendy-look-here-3.flac";
import snd_wendyMisc1 from "../../../resources/audio/characters/wendy/wendy-misc-1.flac";
import snd_wendyMisc2 from "../../../resources/audio/characters/wendy/wendy-misc-2.flac";
import snd_wendyMisc3 from "../../../resources/audio/characters/wendy/wendy-misc-3.flac";
import snd_wendyNearDeath1 from "../../../resources/audio/characters/wendy/wendy-near-death-1.flac";
import snd_wendyNearDeath2 from "../../../resources/audio/characters/wendy/wendy-near-death-2.flac";
import snd_wendyNearDeath4 from "../../../resources/audio/characters/wendy/wendy-near-death-4.flac";
import snd_wendyNearDeath5 from "../../../resources/audio/characters/wendy/wendy-near-death-5.flac";
import snd_wendyNewLevel1 from "../../../resources/audio/characters/wendy/wendy-new-level-1.flac";
import snd_wendyNewLevel2 from "../../../resources/audio/characters/wendy/wendy-new-level-2.flac";
import snd_wendyNewLevel3 from "../../../resources/audio/characters/wendy/wendy-new-level-3.flac";
import snd_wendyNewLevel4 from "../../../resources/audio/characters/wendy/wendy-new-level-4.flac";
import snd_wendyPickup1 from "../../../resources/audio/characters/wendy/wendy-pickup-1.flac";
import snd_wendyPickup2 from "../../../resources/audio/characters/wendy/wendy-pickup-2.flac";
import snd_wendyPickup3 from "../../../resources/audio/characters/wendy/wendy-pickup-3.flac";
import snd_wendyPickup4 from "../../../resources/audio/characters/wendy/wendy-pickup-4.flac";
import snd_wendyPickup5 from "../../../resources/audio/characters/wendy/wendy-pickup-5.flac";
import snd_wendyPickup6 from "../../../resources/audio/characters/wendy/wendy-pickup-6.flac";
import snd_wendyPickup7 from "../../../resources/audio/characters/wendy/wendy-pickup-7.flac";
import snd_wendyRelief1 from "../../../resources/audio/characters/wendy/wendy-relief-1.flac";
import snd_wendyRelief2 from "../../../resources/audio/characters/wendy/wendy-relief-2.flac";
import snd_wendyRelief3 from "../../../resources/audio/characters/wendy/wendy-relief-3.flac";
import snd_wendyRelief4 from "../../../resources/audio/characters/wendy/wendy-relief-4.flac";
import snd_wendyRelief5 from "../../../resources/audio/characters/wendy/wendy-relief-5.flac";
import snd_wendyRelief6 from "../../../resources/audio/characters/wendy/wendy-relief-6.flac";
import snd_wendyTaunt1 from "../../../resources/audio/characters/wendy/wendy-taunt-1.flac";
import snd_wendyTaunt2 from "../../../resources/audio/characters/wendy/wendy-taunt-2.flac";
import snd_wendyTaunt4 from "../../../resources/audio/characters/wendy/wendy-taunt-4.flac";
import snd_wendyTaunt5 from "../../../resources/audio/characters/wendy/wendy-taunt-5.flac";
import snd_wendyTaunt3 from "../../../resources/audio/characters/wendy/wendy-taunt3.flac";
import snd_wendyWorried1 from "../../../resources/audio/characters/wendy/wendy-worried-1.flac";
import snd_wendyWorried2 from "../../../resources/audio/characters/wendy/wendy-worried-2.flac";
import snd_wendyWorried3 from "../../../resources/audio/characters/wendy/wendy-worried-3.flac";
import snd_wendyWorried4 from "../../../resources/audio/characters/wendy/wendy-worried-4.flac";
import img_wendyHead from "../../../resources/images/characters/wendy-head.png";
import img_wendyLeftArm from "../../../resources/images/characters/wendy-left-arm.png";
import img_wendyLeftHand from "../../../resources/images/characters/wendy-left-hand.png";
import img_wendyRightArm from "../../../resources/images/characters/wendy-right-arm.png";
import img_wendyRightHand from "../../../resources/images/characters/wendy-right-hand.png";
import img_wendyTorso from "../../../resources/images/characters/wendy-torso.png";
import { Character } from "./Character";

export const Wendy: Character = {
  textures: {
    head: img_wendyHead,
    leftArm: img_wendyLeftArm,
    leftHand: img_wendyLeftHand,
    rightArm: img_wendyRightArm,
    rightHand: img_wendyRightHand,
    torso: img_wendyTorso,
  },

  sounds: {
    death: [snd_wendyDeath1, snd_wendyDeath2, snd_wendyDeath3, snd_wendyDeath4],
    hurt: [
      snd_wendyHurt1,
      snd_wendyHurt2,
      snd_wendyHurt3,
      snd_wendyHurt4,
      snd_wendyHurt6,
      snd_wendyHurt7,
    ],
    joinParty: [
      snd_wendyJoinParty1,
      snd_wendyJoinParty2,
      snd_wendyJoinParty3,
      snd_wendyJoinParty4,
    ],
    lookHere: [snd_wendyLookHere1, snd_wendyLookHere2, snd_wendyLookHere3],
    misc: [
      // snd_wendyMisc1, // I don't like this one very much
      snd_wendyMisc2,
      snd_wendyMisc3,
    ],
    nearDeath: [
      snd_wendyNearDeath1,
      snd_wendyNearDeath2,
      snd_wendyNearDeath4,
      snd_wendyNearDeath5,
    ],
    newLevel: [
      snd_wendyNewLevel1,
      snd_wendyNewLevel2,
      snd_wendyNewLevel3,
      snd_wendyNewLevel4,
    ],
    pickupItem: [
      snd_wendyPickup1,
      snd_wendyPickup2,
      snd_wendyPickup3,
      snd_wendyPickup4,
      snd_wendyPickup5,
      snd_wendyPickup6,
      snd_wendyPickup7,
    ],
    pickupGun: [
      snd_wendyPickup1,
      snd_wendyPickup2,
      snd_wendyPickup3,
      snd_wendyPickup4,
      snd_wendyPickup5,
      snd_wendyPickup6,
      snd_wendyPickup7,
    ],
    pickupMelee: [
      snd_wendyPickup1,
      snd_wendyPickup2,
      snd_wendyPickup3,
      snd_wendyPickup4,
      snd_wendyPickup5,
      snd_wendyPickup6,
      snd_wendyPickup7,
    ],
    pickupHealth: [
      snd_wendyPickup1,
      snd_wendyPickup2,
      snd_wendyPickup3,
      snd_wendyPickup4,
    ],
    relief: [
      snd_wendyRelief1,
      snd_wendyRelief2,
      snd_wendyRelief3,
      snd_wendyRelief4,
      snd_wendyRelief5,
      snd_wendyRelief6,
    ],
    taunts: [
      snd_wendyTaunt1,
      snd_wendyTaunt2,
      snd_wendyTaunt3,
      snd_wendyTaunt4,
      snd_wendyTaunt5,
    ],
    worried: [
      snd_wendyWorried1,
      snd_wendyWorried2,
      snd_wendyWorried3,
      snd_wendyWorried4,
    ],
  },
};

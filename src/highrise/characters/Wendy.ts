import wendyDeath1 from "../../../resources/audio/characters/wendy/wendy-death-1.flac";
import wendyDeath2 from "../../../resources/audio/characters/wendy/wendy-death-2.flac";
import wendyDeath3 from "../../../resources/audio/characters/wendy/wendy-death-3.flac";
import wendyDeath4 from "../../../resources/audio/characters/wendy/wendy-death-4.flac";
import wendyHurt1 from "../../../resources/audio/characters/wendy/wendy-hurt-1.flac";
import wendyHurt2 from "../../../resources/audio/characters/wendy/wendy-hurt-2.flac";
import wendyHurt3 from "../../../resources/audio/characters/wendy/wendy-hurt-3.flac";
import wendyHurt4 from "../../../resources/audio/characters/wendy/wendy-hurt-4.flac";
import wendyHurt6 from "../../../resources/audio/characters/wendy/wendy-hurt-6.flac";
import wendyHurt7 from "../../../resources/audio/characters/wendy/wendy-hurt-7.flac";
import wendyJoinParty1 from "../../../resources/audio/characters/wendy/wendy-join-party-1.flac";
import wendyJoinParty2 from "../../../resources/audio/characters/wendy/wendy-join-party-2.flac";
import wendyJoinParty3 from "../../../resources/audio/characters/wendy/wendy-join-party-3.flac";
import wendyJoinParty4 from "../../../resources/audio/characters/wendy/wendy-join-party-4.flac";
import wendyLookHere1 from "../../../resources/audio/characters/wendy/wendy-look-here-1.flac";
import wendyLookHere2 from "../../../resources/audio/characters/wendy/wendy-look-here-2.flac";
import wendyLookHere3 from "../../../resources/audio/characters/wendy/wendy-look-here-3.flac";
import wendyMisc1 from "../../../resources/audio/characters/wendy/wendy-misc-1.flac";
import wendyMisc2 from "../../../resources/audio/characters/wendy/wendy-misc-2.flac";
import wendyMisc3 from "../../../resources/audio/characters/wendy/wendy-misc-3.flac";
import wendyNearDeath1 from "../../../resources/audio/characters/wendy/wendy-near-death-1.flac";
import wendyNearDeath2 from "../../../resources/audio/characters/wendy/wendy-near-death-2.flac";
import wendyNearDeath4 from "../../../resources/audio/characters/wendy/wendy-near-death-4.flac";
import wendyNearDeath5 from "../../../resources/audio/characters/wendy/wendy-near-death-5.flac";
import wendyNewLevel1 from "../../../resources/audio/characters/wendy/wendy-new-level-1.flac";
import wendyNewLevel2 from "../../../resources/audio/characters/wendy/wendy-new-level-2.flac";
import wendyNewLevel3 from "../../../resources/audio/characters/wendy/wendy-new-level-3.flac";
import wendyNewLevel4 from "../../../resources/audio/characters/wendy/wendy-new-level-4.flac";
import wendyPickup1 from "../../../resources/audio/characters/wendy/wendy-pickup-1.flac";
import wendyPickup2 from "../../../resources/audio/characters/wendy/wendy-pickup-2.flac";
import wendyPickup3 from "../../../resources/audio/characters/wendy/wendy-pickup-3.flac";
import wendyPickup4 from "../../../resources/audio/characters/wendy/wendy-pickup-4.flac";
import wendyPickup5 from "../../../resources/audio/characters/wendy/wendy-pickup-5.flac";
import wendyPickup6 from "../../../resources/audio/characters/wendy/wendy-pickup-6.flac";
import wendyPickup7 from "../../../resources/audio/characters/wendy/wendy-pickup-7.flac";
import wendyRelief1 from "../../../resources/audio/characters/wendy/wendy-relief-1.flac";
import wendyRelief2 from "../../../resources/audio/characters/wendy/wendy-relief-2.flac";
import wendyRelief3 from "../../../resources/audio/characters/wendy/wendy-relief-3.flac";
import wendyRelief4 from "../../../resources/audio/characters/wendy/wendy-relief-4.flac";
import wendyRelief5 from "../../../resources/audio/characters/wendy/wendy-relief-5.flac";
import wendyRelief6 from "../../../resources/audio/characters/wendy/wendy-relief-6.flac";
import wendyTaunt1 from "../../../resources/audio/characters/wendy/wendy-taunt-1.flac";
import wendyTaunt2 from "../../../resources/audio/characters/wendy/wendy-taunt-2.flac";
import wendyTaunt4 from "../../../resources/audio/characters/wendy/wendy-taunt-4.flac";
import wendyTaunt5 from "../../../resources/audio/characters/wendy/wendy-taunt-5.flac";
import wendyTaunt3 from "../../../resources/audio/characters/wendy/wendy-taunt3.flac";
import wendyWorried1 from "../../../resources/audio/characters/wendy/wendy-worried-1.flac";
import wendyWorried2 from "../../../resources/audio/characters/wendy/wendy-worried-2.flac";
import wendyWorried3 from "../../../resources/audio/characters/wendy/wendy-worried-3.flac";
import wendyWorried4 from "../../../resources/audio/characters/wendy/wendy-worried-4.flac";
import wendyHead from "../../../resources/images/characters/wendy-head.png";
import wendyLeftArm from "../../../resources/images/characters/wendy-left-arm.png";
import wendyLeftHand from "../../../resources/images/characters/wendy-left-hand.png";
import wendyRightArm from "../../../resources/images/characters/wendy-right-arm.png";
import wendyRightHand from "../../../resources/images/characters/wendy-right-hand.png";
import wendyTorso from "../../../resources/images/characters/wendy-torso.png";
import { Character } from "./Character";

export const Wendy: Character = {
  textures: {
    head: wendyHead,
    leftArm: wendyLeftArm,
    leftHand: wendyLeftHand,
    rightArm: wendyRightArm,
    rightHand: wendyRightHand,
    torso: wendyTorso,
  },

  sounds: {
    death: [wendyDeath1, wendyDeath2, wendyDeath3, wendyDeath4],
    hurt: [
      wendyHurt1,
      wendyHurt2,
      wendyHurt3,
      wendyHurt4,
      wendyHurt6,
      wendyHurt7,
    ],
    joinParty: [
      wendyJoinParty1,
      wendyJoinParty2,
      wendyJoinParty3,
      wendyJoinParty4,
    ],
    lookHere: [wendyLookHere1, wendyLookHere2, wendyLookHere3],
    misc: [wendyMisc1, wendyMisc2, wendyMisc3],
    nearDeath: [
      wendyNearDeath1,
      wendyNearDeath2,
      wendyNearDeath4,
      wendyNearDeath5,
    ],
    newLevel: [wendyNewLevel1, wendyNewLevel2, wendyNewLevel3, wendyNewLevel4],
    pickupItem: [
      wendyPickup1,
      wendyPickup2,
      wendyPickup3,
      wendyPickup4,
      wendyPickup5,
      wendyPickup6,
      wendyPickup7,
    ],
    pickupGun: [
      wendyPickup1,
      wendyPickup2,
      wendyPickup3,
      wendyPickup4,
      wendyPickup5,
      wendyPickup6,
      wendyPickup7,
    ],
    pickupMelee: [
      wendyPickup1,
      wendyPickup2,
      wendyPickup3,
      wendyPickup4,
      wendyPickup5,
      wendyPickup6,
      wendyPickup7,
    ],
    pickupHealth: [wendyPickup1, wendyPickup2, wendyPickup3, wendyPickup4],
    relief: [
      wendyRelief1,
      wendyRelief2,
      wendyRelief3,
      wendyRelief4,
      wendyRelief5,
      wendyRelief6,
    ],
    taunts: [wendyTaunt1, wendyTaunt2, wendyTaunt3, wendyTaunt4, wendyTaunt5],
    worried: [wendyWorried1, wendyWorried2, wendyWorried3, wendyWorried4],
  },
};

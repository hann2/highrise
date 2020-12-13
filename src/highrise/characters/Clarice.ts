import snd_clariceDeath1 from "../../../resources/audio/characters/clarice/clarice-death-1.flac";
import snd_clariceDeath2 from "../../../resources/audio/characters/clarice/clarice-death-2.flac";
import snd_clariceHurt1 from "../../../resources/audio/characters/clarice/clarice-hurt-1.flac";
import snd_clariceHurt2 from "../../../resources/audio/characters/clarice/clarice-hurt-2.flac";
import snd_clariceHurt3 from "../../../resources/audio/characters/clarice/clarice-hurt-3.flac";
import snd_clariceJoinParty1 from "../../../resources/audio/characters/clarice/clarice-join-party-1.flac";
import snd_clariceLookHere1 from "../../../resources/audio/characters/clarice/clarice-look-here-1.flac";
import snd_clariceMisc1 from "../../../resources/audio/characters/clarice/clarice-misc-1.flac";
import snd_clariceMisc2 from "../../../resources/audio/characters/clarice/clarice-misc-2.flac";
import snd_clariceNearDeath from "../../../resources/audio/characters/clarice/clarice-near-death.flac";
import snd_clariceNewLevel1 from "../../../resources/audio/characters/clarice/clarice-new-level-1.flac";
import snd_claricePickup1 from "../../../resources/audio/characters/clarice/clarice-pickup-1.flac";
import snd_clariceRelief1 from "../../../resources/audio/characters/clarice/clarice-relief-1.flac";
import snd_clariceRelief2 from "../../../resources/audio/characters/clarice/clarice-relief-2.flac";
import snd_clariceTaunt1 from "../../../resources/audio/characters/clarice/clarice-taunt-1.flac";
import snd_clariceWorried1 from "../../../resources/audio/characters/clarice/clarice-worried-1.flac";
import img_clariceHead from "../../../resources/images/characters/clarice-head.png";
import img_clariceLeftArm from "../../../resources/images/characters/clarice-left-arm.png";
import img_clariceLeftHand from "../../../resources/images/characters/clarice-left-hand.png";
import img_clariceRightArm from "../../../resources/images/characters/clarice-right-arm.png";
import img_clariceRightHand from "../../../resources/images/characters/clarice-right-hand.png";
import img_clariceTorso from "../../../resources/images/characters/clarice-torso.png";
import { Character } from "./Character";

export const Clarice: Character = {
  textures: {
    head: img_clariceHead,
    leftArm: img_clariceLeftArm,
    leftHand: img_clariceLeftHand,
    rightArm: img_clariceRightArm,
    rightHand: img_clariceRightHand,
    torso: img_clariceTorso,
  },

  sounds: {
    death: [snd_clariceDeath1, snd_clariceDeath2],
    hurt: [snd_clariceHurt1, snd_clariceHurt2, snd_clariceHurt3],
    joinParty: [snd_clariceJoinParty1],
    lookHere: [snd_clariceLookHere1],
    misc: [snd_clariceMisc1, snd_clariceMisc2],
    nearDeath: [snd_clariceNearDeath],
    newLevel: [snd_clariceNewLevel1],
    pickupItem: [snd_claricePickup1],
    pickupGun: [snd_claricePickup1],
    pickupMelee: [snd_claricePickup1],
    pickupHealth: [snd_claricePickup1],
    relief: [snd_clariceRelief1, snd_clariceRelief2],
    taunts: [snd_clariceTaunt1],
    worried: [snd_clariceWorried1],
  },
};

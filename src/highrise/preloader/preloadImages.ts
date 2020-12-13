import bloodDrop from "../../../resources/images/bloodsplats/blood-drop.png";
import impactParticle from "../../../resources/images/effects/impact-particle.png";
import woodenFloor from "../../../resources/images/environment/floor/wooden-floor.png";
import wall1 from "../../../resources/images/environment/wall-1.png";
import wallAo1 from "../../../resources/images/environment/wall-ao-1.png";
import healthPack from "../../../resources/images/health_pack.png";
import pointLight from "../../../resources/images/lights/point-light.png";
import solidCircle from "../../../resources/images/solid-circle.png";
import zombie1Hold from "../../../resources/images/zombies/zombie1_hold.png";
import zombie1Stand from "../../../resources/images/zombies/zombie1_stand.png";
import { CHARACTERS } from "../characters/Character";
import { BLOOD_SPLAT_URLS } from "../effects/BloodSplat";
import { MUZZLE_FLASH_URLS } from "../effects/MuzzleFlash";
import { DOOR_SPRITES } from "../entities/Door";
import { VENDING_MACHINES } from "../entities/environment/VendingMachine";
import { SUBFLOOR_TEXTURES } from "../SubFloor";
import * as DecorationSprites from "../view/DecorationSprite";
import { WEAPONS } from "../weapons";

// Returns the list of all
export function getImagesToPreload(): Set<string> {
  const imageUrls = new Set([
    // use a set to make sure we don't include stuff multiple times
    bloodDrop,
    healthPack,
    impactParticle,
    pointLight,
    solidCircle,
    wall1,
    wallAo1,
    woodenFloor,
    zombie1Hold,
    zombie1Stand,

    ...Object.values(DecorationSprites).map((sprite) => sprite.imageName),

    ...DOOR_SPRITES,
    ...VENDING_MACHINES.flat(),

    ...SUBFLOOR_TEXTURES,
    ...MUZZLE_FLASH_URLS,
    ...BLOOD_SPLAT_URLS,

    ...CHARACTERS.map((c) => Object.values(c.textures)).flat(),
    ...WEAPONS.map((weapon) => Object.values(weapon.textures)).flat(),
  ]);

  // Just in case this sneaks in there somehow, make sure we don't load it
  imageUrls.delete(undefined!);

  return imageUrls;
}

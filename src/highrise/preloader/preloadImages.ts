import bathroom from "../../../resources/images/environment/bathroom.png";
import carpet from "../../../resources/images/environment/carpet.png";
import fancyFurniture from "../../../resources/images/environment/fancy-furniture.png";
import fencesLights from "../../../resources/images/environment/fences-lights.png";
import industrialCarpet001 from "../../../resources/images/environment/floor/IndustrialCarpet-001.jpg";
import industrialCarpet002 from "../../../resources/images/environment/floor/IndustrialCarpet-002.jpg";
import furniture from "../../../resources/images/environment/furniture.png";
import market from "../../../resources/images/environment/market.png";
import woodenFloor from "../../../resources/images/environment/wooden-floor.png";
import healthPack from "../../../resources/images/health_pack.png";
import pointLight from "../../../resources/images/lights/point-light.png";
import zombie1Hold from "../../../resources/images/zombies/zombie1_hold.png";
import zombie1Stand from "../../../resources/images/zombies/zombie1_stand.png";
import { CHARACTERS } from "../characters/Character";
import { BLOOD_SPLAT_URLS } from "../effects/BloodSplat";
import { MUZZLE_FLASH_URLS } from "../effects/MuzzleFlash";
import { WEAPONS } from "../weapons";

// Returns the list of all
export function getImagesToPreload(): Set<string> {
  const imageUrls = new Set([
    // use a set to make sure we don't include stuff multiple times
    bathroom,
    fancyFurniture,
    fencesLights,
    furniture,
    carpet,
    woodenFloor,
    healthPack,
    market,
    pointLight,
    zombie1Hold,
    zombie1Stand,

    industrialCarpet001,
    industrialCarpet002,

    ...MUZZLE_FLASH_URLS,
    ...BLOOD_SPLAT_URLS,

    ...CHARACTERS.map((c) => Object.values(c.textures)).flat(),
    ...WEAPONS.map((weapon) => Object.values(weapon.textures)).flat(),
  ]);

  // Just in case this sneaks in there somehow, make sure we don't load it
  imageUrls.delete(undefined!);

  return imageUrls;
}

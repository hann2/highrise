import bathroom from "../../../resources/images/environment/bathroom.png";
import fancyFurniture from "../../../resources/images/environment/fancy-furniture.png";
import fencesLights from "../../../resources/images/environment/fences-lights.png";
import furniture from "../../../resources/images/environment/furniture.png";
import market from "../../../resources/images/environment/market.png";
import healthPack from "../../../resources/images/health_pack.png";
import pointLight from "../../../resources/images/lights/point-light.png";
import zombie1Hold from "../../../resources/images/zombies/zombie1_hold.png";
import zombie1Stand from "../../../resources/images/zombies/zombie1_stand.png";
import { CHARACTERS } from "../characters/characters";
import { BLOOD_SPLAT_URLS } from "../effects/BloodSplat";
import { MUZZLE_FLASH_URLS } from "../effects/MuzzleFlash";
import { GUNS } from "../entities/guns/Guns";
import { MELEE_WEAPONS } from "../entities/meleeWeapons/MeleeWeapons";

// Returns the list of all
export function getImagesToPreload(): Set<string> {
  const imageUrls = new Set([
    // use a set to make sure we don't include stuff multiple times
    bathroom,
    fancyFurniture,
    fencesLights,
    furniture,
    healthPack,
    market,
    pointLight,
    zombie1Hold,
    zombie1Stand,

    ...MUZZLE_FLASH_URLS,
    ...BLOOD_SPLAT_URLS,

    ...CHARACTERS.map((c) => c.imageStand),
    ...CHARACTERS.map((c) => c.imageGun),
    ...CHARACTERS.map((c) => c.imageReload),
    ...CHARACTERS.map((c) => c.imageHold),
    ...CHARACTERS.map((c) => c.imageHold),

    ...GUNS.map((G) => new G().stats.pickupTexture),
    ...MELEE_WEAPONS.map((M) => new M().stats.attackTexture),
    ...MELEE_WEAPONS.map((M) => new M().stats.holdTexture),
    ...MELEE_WEAPONS.map((M) => new M().stats.pickupTexture),
  ]);

  return imageUrls;
}

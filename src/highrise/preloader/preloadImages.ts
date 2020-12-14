import img_bloodDrop from "../../../resources/images/bloodsplats/blood-drop.png";
import img_impactParticle from "../../../resources/images/effects/impact-particle.png";
import img_woodenFloor from "../../../resources/images/environment/floor/wooden-floor.png";
import img_wall1 from "../../../resources/images/environment/wall-1.png";
import img_wallAo1 from "../../../resources/images/environment/wall-ao-1.png";
import img_healthPack from "../../../resources/images/health_pack.png";
import img_pointLight from "../../../resources/images/lights/point-light.png";
import img_solidCircle from "../../../resources/images/solid-circle.png";
import img_crawler from "../../../resources/images/zombies/crawler.png";
import img_heavy from "../../../resources/images/zombies/heavy.png";
import img_necromancer from "../../../resources/images/zombies/necromancer.png";
import img_spitter from "../../../resources/images/zombies/spitter.png";
import img_zombie from "../../../resources/images/zombies/zombie.png";
import img_zombie1Hold from "../../../resources/images/zombies/zombie1_hold.png";
import img_zombie1Stand from "../../../resources/images/zombies/zombie1_stand.png";
import { CHARACTERS } from "../characters/Character";
import { BLOOD_SPLAT_URLS } from "../effects/BloodSplat";
import { GLOWSTICK_URLS } from "../effects/GlowStick";
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
    img_bloodDrop,
    img_crawler,
    img_healthPack,
    img_impactParticle,
    img_pointLight,
    img_solidCircle,
    img_wall1,
    img_wallAo1,
    img_woodenFloor,
    img_zombie1Hold,
    img_zombie1Stand,
    img_zombie,
    img_heavy,
    img_spitter,
    img_necromancer,

    ...Object.values(DecorationSprites).map((sprite) => sprite.imageName),

    ...BLOOD_SPLAT_URLS,
    ...DOOR_SPRITES,
    ...GLOWSTICK_URLS,
    ...MUZZLE_FLASH_URLS,
    ...SUBFLOOR_TEXTURES,
    ...VENDING_MACHINES.flat(),

    ...CHARACTERS.map((c) => Object.values(c.textures)).flat(),
    ...WEAPONS.map((weapon) => Object.values(weapon.textures)).flat(),
  ]);

  // Just in case this sneaks in there somehow, make sure we don't load it
  imageUrls.delete(undefined!);

  return imageUrls;
}

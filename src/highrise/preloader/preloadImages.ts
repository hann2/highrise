import img_impactParticle from "../../../resources/images/effects/impact-particle.png";
import img_woodenFloor from "../../../resources/images/environment/floor/wooden-floor.png";
import img_transformer from "../../../resources/images/environment/maintenance/transformer.png";
import img_wall1 from "../../../resources/images/environment/wall-1.png";
import img_wallAo1 from "../../../resources/images/environment/wall-ao-1.png";
import img_healthPack from "../../../resources/images/health_pack.png";
import img_pointLight from "../../../resources/images/lights/point-light.png";
import img_solidCircle from "../../../resources/images/solid-circle.png";
import img_crawler from "../../../resources/images/zombies/crawler.png";
import img_heavy from "../../../resources/images/zombies/heavy.png";
import img_necromancer from "../../../resources/images/zombies/necromancer.png";
import img_spitter from "../../../resources/images/zombies/spitter.png";
import { CHARACTERS } from "../characters/Character";
import { ZOMBIE_TEXTURES } from "../constants";
import { GLOWSTICK_TEXTURES } from "../effects/GlowStick";
import { MUZZLE_FLASH_URLS } from "../effects/MuzzleFlash";
import { SPLATS_AND_BLOBS_TEXTURES } from "../effects/Splat";
import * as DecorationSprites from "../environment/decorations/decorations";
import { DOOR_SPRITES } from "../environment/Door";
import { VENDING_MACHINES } from "../environment/VendingMachine";
import { WEAPONS } from "../weapons/weapons";

// Returns the list of all
export function getImagesToPreload(): Set<string> {
  const imageUrls = new Set([
    // use a set to make sure we don't include stuff multiple times
    img_crawler,
    img_healthPack,
    img_impactParticle,
    img_pointLight,
    img_solidCircle,
    img_wall1,
    img_wallAo1,
    img_woodenFloor,
    img_heavy,
    img_spitter,
    img_necromancer,
    img_transformer,

    ...Object.values(DecorationSprites).map((sprite) => sprite.imageName),
    ...ZOMBIE_TEXTURES.map((z) => Object.values(z)).flat(),
    ...SPLATS_AND_BLOBS_TEXTURES,
    ...DOOR_SPRITES,
    ...GLOWSTICK_TEXTURES,
    ...MUZZLE_FLASH_URLS,
    ...VENDING_MACHINES.flat(),

    ...CHARACTERS.map((c) => Object.values(c.textures)).flat(),
    ...WEAPONS.map((weapon) => Object.values(weapon.textures)).flat(),
  ]);

  console.log(ZOMBIE_TEXTURES.map((z) => Object.values(z)).flat());

  // Just in case this sneaks in there somehow, make sure we don't load it
  imageUrls.delete(undefined!);

  return imageUrls;
}

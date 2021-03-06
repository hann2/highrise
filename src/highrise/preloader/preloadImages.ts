import img_healthOverlay from "../../../resources/images/effects/health-overlay.png";
import img_impactParticle from "../../../resources/images/effects/impact-particle.png";
import img_chainLinkFence from "../../../resources/images/environment/chain-link-fence.png";
import img_fence from "../../../resources/images/environment/fence.png";
import img_woodenFloor from "../../../resources/images/environment/floor/wooden-floor.png";
import img_transformer from "../../../resources/images/environment/maintenance/transformer.png";
import img_wall1 from "../../../resources/images/environment/wall-1.png";
import img_wallAo1 from "../../../resources/images/environment/wall-ao-1.png";
import img_healthKit from "../../../resources/images/health-kit.png";
import img_pointLight from "../../../resources/images/lights/point-light.png";
import img_solidCircle from "../../../resources/images/solid-circle.png";
import img_crawler from "../../../resources/images/zombies/crawler.png";
import img_heavy from "../../../resources/images/zombies/heavy.png";
import img_necromancer from "../../../resources/images/zombies/necromancer.png";
import img_spitter from "../../../resources/images/zombies/spitter.png";
import { CHARACTERS } from "../characters/Character";
import { CRAWLER_TEXTURES, ZOMBIE_TEXTURES } from "../constants/constants";
import { GLOWSTICK_TEXTURES } from "../effects/GlowStick";
import { MUZZLE_FLASH_URLS } from "../effects/MuzzleFlash";
import { SPLATS_AND_BLOBS_TEXTURES } from "../effects/Splat";
import * as DECORATION_INFOS from "../environment/decorations/decorations";
import { DEFAULT_DOOR_SPRITES } from "../environment/Door";
import { VENDING_MACHINES } from "../environment/furniture-plus/VendingMachine";
import { WEAPONS } from "../weapons/weapons";

// Returns the list of all
export function getImagesToPreload(): Set<string> {
  // use a set to make sure we don't include stuff multiple times
  const imageUrls = new Set([
    img_chainLinkFence,
    img_fence,
    img_healthKit,
    img_healthOverlay,
    img_heavy,
    img_impactParticle,
    img_necromancer,
    img_pointLight,
    img_solidCircle,
    img_spitter,
    img_transformer,
    img_wall1,
    img_wallAo1,
    img_woodenFloor,

    ...Object.values(DECORATION_INFOS).map((sprite) => sprite.imageName),
    ...ZOMBIE_TEXTURES.flatMap((z) => Object.values(z)),
    ...CRAWLER_TEXTURES.flatMap((z) => Object.values(z)),
    ...SPLATS_AND_BLOBS_TEXTURES,
    ...DEFAULT_DOOR_SPRITES,
    ...GLOWSTICK_TEXTURES,
    ...MUZZLE_FLASH_URLS,
    ...VENDING_MACHINES.flat(),

    ...CHARACTERS.flatMap((c) => Object.values(c.textures)),
    ...WEAPONS.flatMap((weapon) => Object.values(weapon.textures)),
  ]);

  // Just in case this sneaks in there somehow, make sure we don't load it
  imageUrls.delete(undefined!);

  return imageUrls;
}

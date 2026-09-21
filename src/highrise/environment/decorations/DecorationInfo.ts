import { Rectangle, Texture } from "pixi.js";
import { ImageName, SoundName } from "../../../../resources/resources";
import { V2d } from "../../../core/Vector";

/**
 * Links scaling of sprites so that pixels/meter is the same
 *
 * Useful if you have a bunch of potted plants and want all the pots to be the
 *    same size, even if the sprites and objects are very different sizes.
 */
export const decorationRelativeTo = (
  partial: Omit<DecorationInfo, "heightMeters">,
  decorationSprite: DecorationInfo,
): DecorationInfo => {
  if (!partial.sheetInfo || !decorationSprite.sheetInfo) {
    throw new Error("You need dimensions ");
  }
  return {
    ...partial,
    heightMeters:
      (decorationSprite.heightMeters * partial.sheetInfo.dimensions.y) /
      decorationSprite.sheetInfo.dimensions.y,
  };
};

interface SheetInfo {
  offset: V2d; // origin point in the sprite sheet in pixels.
  dimensions: V2d; // size of region on the sprite sheet in pixels
}

export interface DecorationInfo {
  imageName: ImageName;
  heightMeters: number; // height of object in world space (meters)
  sheetInfo?: SheetInfo; // how to get the decoration from the sprite sheet
  isSolid?: boolean; // whether or not this blocks movement
  isHittable?: boolean; // whether or not this blocks movement
  bodyInset?: [number, number]; // meters to inset the body from the outside of the image
  rotation?: number; // radians to rotate the texture
  corners?: [number, number][]; // corners for the physics body. Otherwise uses a square
  hitSounds?: SoundName[]; // Sounds to make when hit
}

export function getDecorationTexture(decorationInfo: DecorationInfo): Texture {
  if (decorationInfo.sheetInfo) {
    const { offset, dimensions } = decorationInfo.sheetInfo;
    return new Texture({
      source: Texture.from(decorationInfo.imageName).source,
      frame: new Rectangle(...offset, ...dimensions),
    });
  } else {
    return Texture.from(decorationInfo.imageName);
  }
}

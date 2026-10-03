import { Texture } from "pixi.js";

/** How dark a contact shadow is right against what casts it, 0 to 1 */
export const CONTACT_SHADOW_DARKNESS = 0.4;
/** Pixels of the texture from the edge of the rectangle to the shadow's end */
export const CONTACT_SHADOW_BORDER = 32;
/** The texture's width and height: a border each side of a 2 × 2 middle */
export const CONTACT_SHADOW_TEXTURE_SIZE = CONTACT_SHADOW_BORDER * 2 + 2;

let contactShadowTexture: Texture | undefined;

/**
 * A soft shadow around a rectangle, cut like a nine-slice sprite with
 * borders of `CONTACT_SHADOW_BORDER` (see `ContactShadow`): the middle is
 * the rectangle (fully dark), the edges fade out away from it and the
 * corners fade out around them, so the shadow keeps its rounded ends at any
 * size. Opaque, white where there's no
 * shadow, since contact shadows are drawn with the "min" blend mode, which
 * ignores alpha.
 */
export function getContactShadowTexture(): Texture {
  if (!contactShadowTexture) {
    const border = CONTACT_SHADOW_BORDER;
    const size = CONTACT_SHADOW_TEXTURE_SIZE;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(size, size);
    const middle = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // How far the pixel is from the rectangle (the middle 2 × 2 pixels)
        const dx = Math.max(0, Math.abs(x + 0.5 - middle) - 1);
        const dy = Math.max(0, Math.abs(y + 0.5 - middle) - 1);
        const t = Math.min(1, Math.hypot(dx, dy) / border);
        const shade = 1 - CONTACT_SHADOW_DARKNESS * (1 - t * t * (3 - 2 * t));
        const i = (y * size + x) * 4;
        image.data[i] =
          image.data[i + 1] =
          image.data[i + 2] =
            Math.round(shade * 255);
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    contactShadowTexture = Texture.from(canvas);
    contactShadowTexture.source.addressMode = "clamp-to-edge";
    contactShadowTexture.source.scaleMode = "linear";
  }
  return contactShadowTexture;
}

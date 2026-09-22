import { Texture } from "pixi.js";

const PENUMBRA_TEXTURE_SIZE = 128;
let penumbraTexture: Texture | undefined;

/**
 * An angular gradient for penumbra wedges. A wedge triangle gets texture
 * coordinates (0,0) at the occluder's corner, (1,0) at the far end of its
 * umbra edge and (1,1) at the far end of its lit edge. Coverage then depends
 * only on the angle from the corner: fully covered along v = 0, uncovered
 * along v = u. Because texture coordinates interpolate linearly across the
 * triangle, that angle is exact everywhere in the wedge.
 */
export function getPenumbraTexture(): Texture {
  if (!penumbraTexture) {
    const size = PENUMBRA_TEXTURE_SIZE;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x + 0.5) / size;
        const v = (y + 0.5) / size;
        const t = Math.min(1, v / u);
        // Smooth falloff, roughly the fraction of a disc light that is hidden
        const alpha = 1 - t * t * (3 - 2 * t);
        const i = (y * size + x) * 4;
        image.data[i] = 255;
        image.data[i + 1] = 255;
        image.data[i + 2] = 255;
        image.data[i + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(image, 0, 0);
    penumbraTexture = Texture.from(canvas);
    penumbraTexture.source.addressMode = "clamp-to-edge";
    penumbraTexture.source.scaleMode = "linear";
  }
  return penumbraTexture;
}

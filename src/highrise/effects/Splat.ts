import snd_melonPlop1 from "../../../resources/audio/food/individual/melon-plop-1.flac";
import snd_melonPlop2 from "../../../resources/audio/food/individual/melon-plop-2.flac";
import snd_melonPlop3 from "../../../resources/audio/food/individual/melon-plop-3.flac";
import snd_melonPlop4 from "../../../resources/audio/food/individual/melon-plop-4.flac";
import snd_melonPlop5 from "../../../resources/audio/food/individual/melon-plop-5.flac";
import snd_melonPlop6 from "../../../resources/audio/food/individual/melon-plop-6.flac";
import img_blob1 from "../../../resources/images/splats/blob-1.png";
import img_blob2 from "../../../resources/images/splats/blob-2.png";
import img_blob3 from "../../../resources/images/splats/blob-3.png";
import img_blob4 from "../../../resources/images/splats/blob-4.png";
import img_blob5 from "../../../resources/images/splats/blob-5.png";
import img_blobGlow1 from "../../../resources/images/splats/blob-glow-1.png";
import img_blobGlow2 from "../../../resources/images/splats/blob-glow-2.png";
import img_blobGlow3 from "../../../resources/images/splats/blob-glow-3.png";
import img_blobGlow4 from "../../../resources/images/splats/blob-glow-4.png";
import img_blobGlow5 from "../../../resources/images/splats/blob-glow-5.png";
import img_splatGlow1 from "../../../resources/images/splats/splat-glow_1.png";
import img_splatGlow2 from "../../../resources/images/splats/splat-glow_2.png";
import img_splatGlow3 from "../../../resources/images/splats/splat-glow_3.png";
import img_splatGlow4 from "../../../resources/images/splats/splat-glow_4.png";
import img_splatGlow5 from "../../../resources/images/splats/splat-glow_5.png";
import img_splatGlow6 from "../../../resources/images/splats/splat-glow_6.png";
import img_splatGlow7 from "../../../resources/images/splats/splat-glow_7.png";
import img_splat1 from "../../../resources/images/splats/splat_1.png";
import img_splat2 from "../../../resources/images/splats/splat_2.png";
import img_splat3 from "../../../resources/images/splats/splat_3.png";
import img_splat4 from "../../../resources/images/splats/splat_4.png";
import img_splat5 from "../../../resources/images/splats/splat_5.png";
import img_splat6 from "../../../resources/images/splats/splat_6.png";
import img_splat7 from "../../../resources/images/splats/splat_7.png";
import { rInteger } from "../../core/util/Random";
import { ShuffleRing } from "../utils/ShuffleRing";

// This file is for all the constants shared by splatty stuff

export const SPLAT_TEXTURES = [
  img_splat1,
  img_splat2,
  img_splat3,
  img_splat4,
  img_splat5,
  img_splat6,
  img_splat7,
];

export const SPLAT_GLOW_TEXTURES = [
  img_splatGlow1,
  img_splatGlow2,
  img_splatGlow3,
  img_splatGlow4,
  img_splatGlow5,
  img_splatGlow6,
  img_splatGlow7,
];

export const SPLAT_SOUNDS = [
  snd_melonPlop1,
  snd_melonPlop2,
  snd_melonPlop3,
  snd_melonPlop4,
  snd_melonPlop5,
  snd_melonPlop6,
];

export const BLOB_TEXTURES = [
  img_blob1,
  img_blob2,
  img_blob3,
  img_blob4,
  img_blob5,
];

export const BLOB_GLOW_TEXTURES = [
  img_blobGlow1,
  img_blobGlow2,
  img_blobGlow3,
  img_blobGlow4,
  img_blobGlow5,
];

const splatSoundRing = new ShuffleRing(SPLAT_SOUNDS);

export function getSplatSound() {
  return splatSoundRing.getNext();
}

export function getSplatPair() {
  const i = rInteger(0, SPLAT_TEXTURES.length);
  return [SPLAT_TEXTURES[i], SPLAT_GLOW_TEXTURES[i]];
}

export function getBlobPair() {
  const i = rInteger(0, BLOB_TEXTURES.length);
  return [BLOB_TEXTURES[i], BLOB_GLOW_TEXTURES[i]];
}

// Export everything so it can get preloaded
export const SPLATS_AND_BLOBS_TEXTURES = [
  ...SPLAT_TEXTURES,
  ...SPLAT_GLOW_TEXTURES,
  ...BLOB_TEXTURES,
  ...BLOB_GLOW_TEXTURES,
];

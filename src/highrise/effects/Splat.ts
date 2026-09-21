import { ImageName, SoundName } from "../../../resources/resources";
import { rInteger } from "../../core/util/Random";
import { ShuffleRing } from "../utils/ShuffleRing";

// This file is for all the constants shared by splatty stuff

export const SPLAT_TEXTURES: ImageName[] = [
  "splat1",
  "splat2",
  "splat3",
  "splat4",
  "splat5",
  "splat6",
  "splat7",
];

export const SPLAT_GLOW_TEXTURES: ImageName[] = [
  "splatGlow1",
  "splatGlow2",
  "splatGlow3",
  "splatGlow4",
  "splatGlow5",
  "splatGlow6",
  "splatGlow7",
];

export const SPLAT_SOUNDS: SoundName[] = [
  "melonPlop1",
  "melonPlop2",
  "melonPlop3",
  "melonPlop4",
  "melonPlop5",
  "melonPlop6",
];

export const BLOB_TEXTURES: ImageName[] = [
  "blob1",
  "blob2",
  "blob3",
  "blob4",
  "blob5",
];

export const BLOB_GLOW_TEXTURES: ImageName[] = [
  "blobGlow1",
  "blobGlow2",
  "blobGlow3",
  "blobGlow4",
  "blobGlow5",
];

const splatSoundRing = new ShuffleRing(SPLAT_SOUNDS);

export function getSplatSound(): SoundName {
  return splatSoundRing.getNext();
}

export function getSplatPair(): [ImageName, ImageName] {
  const i = rInteger(0, SPLAT_TEXTURES.length);
  return [SPLAT_TEXTURES[i], SPLAT_GLOW_TEXTURES[i]];
}

export function getBlobPair(): [ImageName, ImageName] {
  const i = rInteger(0, BLOB_TEXTURES.length);
  return [BLOB_TEXTURES[i], BLOB_GLOW_TEXTURES[i]];
}

import * as Pixi from "pixi.js";

export const imageUrls = {};

export function loadPixiAssets() {
  return new Promise((resolve) => {
    const loader = Pixi.Loader.shared;
    for (const url of Object.values(imageUrls)) {
      loader.add(url);
    }
    loader.load((_, resources) => {
      resolve(resources);
    });
  });
}

export function getSprites() {
  return Pixi.Loader.shared.resources;
}

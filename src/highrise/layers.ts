import Game from "../core/Game";
import { LayerInfo } from "../core/graphics/LayerInfo";

// Layers for rendering stuff in front of other stuff
export enum Layers {
  // The floor
  FLOOR = "floor",
  // Stuff on the floor
  WORLD_BACK = "world_back",
  // Stuff at the human's level
  WEAPONS = "world_weapons",
  // Stuff at the human's level
  WORLD = "world",
  // Stuff above the humans
  WORLD_FRONT = "world_front",
  // Special layer for lighting
  LIGHTING = "lighting",
  // Most top level thing for HUD elements that are physically placed
  WORLD_OVERLAY = "world_overlay",
  // Stuff not in the world
  HUD = "hud",
}

// Set up the game to use our layers
export function initLayers(game: Game) {
  game.renderer.createLayer(Layers.FLOOR, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD_BACK, new LayerInfo());
  game.renderer.createLayer(Layers.WEAPONS, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD_FRONT, new LayerInfo());
  game.renderer.createLayer(Layers.LIGHTING, new LayerInfo({ paralax: 0 }));
  game.renderer.createLayer(Layers.WORLD_OVERLAY, new LayerInfo());
  game.renderer.createLayer(Layers.HUD, new LayerInfo({ paralax: 0 }));

  game.renderer.defaultLayer = Layers.WORLD;
}

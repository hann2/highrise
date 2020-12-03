import Game from "../core/Game";
import { LayerInfo } from "../core/graphics/LayerInfo";

// Layers for rendering stuff in front of other stuff
export enum Layers {
  // The floor
  FLOOR = "floor",
  // Stuff on the floor
  WORLD_BACK = "world_back",
  // Stuff at the human's level
  WORLD = "world",
  // Stuff above the humans
  WORLD_FRONT = "world_front",
  // Stuff not in the world
  HUD = "hud",
}

// Set up the game to use our layers
export function initLayers(game: Game) {
  game.renderer.createLayer(Layers.WORLD_BACK, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD_FRONT, new LayerInfo());
  game.renderer.createLayer(Layers.HUD, new LayerInfo({ paralax: 0 }));

  game.renderer.defaultLayer = Layers.WORLD;
}

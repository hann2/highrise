import Game from "../core/Game";
import { LayerInfo } from "../core/graphics/LayerInfo";

// Layers for rendering stuff in front of other stuff
export enum Layers {
  WORLD_BACK = "world_back",
  WORLD = "world",
  WORLD_FRONT = "world_front",
}

// Set up the game to use our layers
export function initLayers(game: Game) {
  game.renderer.createLayer(Layers.WORLD_BACK, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD_FRONT, new LayerInfo());

  game.renderer.defaultLayer = Layers.WORLD;
}

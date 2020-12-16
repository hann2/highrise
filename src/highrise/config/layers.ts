import Game from "../../core/Game";
import { LayerInfo } from "../../core/graphics/LayerInfo";

// Layers for rendering stuff in front of other stuff
export enum Layers {
  // The floor under the floor
  SUBFLOOR = "subfloor",
  // The floor
  FLOOR = "floor",
  // stuff on the floor
  FLOOR2 = "floor2",
  // stuff on the floor
  FLOOR3 = "floor3",
  // stuff on the floor
  FLOOR4 = "floor4",
  // stuff on the floor
  FLOOR5 = "floor5",
  // ambient occlusion on the floor
  AO = "ao",
  // Stuff on the floor
  WORLD_BACK = "world_back",
  // Stuff at the human's chest level
  WEAPONS = "world_weapons",
  // Walls n stuff
  WALLS = "walls",
  // Stuff at the human's level
  WORLD = "world",
  // Stuff above the humans
  WORLD_FRONT = "world_front",
  // Special layer for lighting, in screen coordinates because the LightingManager does the transforms
  LIGHTING = "lighting",
  // Layer for stuff that is lit on its own, in world coordinates
  EMISSIVES = "emissives",
  // Special layer for vision, in world coordinates
  VISION = "vision",
  // Most top level thing for HUD elements that are placed in world coordinates
  WORLD_OVERLAY = "world_overlay",
  // Stuff not in the world
  HUD = "hud",
  // Stuff above even the HUD
  MENU = "menu",
}

// Set up the game to use our layers
export function initLayers(game: Game) {
  game.renderer.createLayer(Layers.SUBFLOOR, new LayerInfo());
  game.renderer.createLayer(Layers.FLOOR, new LayerInfo());
  game.renderer.createLayer(Layers.FLOOR2, new LayerInfo());
  game.renderer.createLayer(Layers.FLOOR3, new LayerInfo());
  game.renderer.createLayer(Layers.FLOOR4, new LayerInfo());
  game.renderer.createLayer(Layers.FLOOR5, new LayerInfo());
  game.renderer.createLayer(Layers.AO, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD_BACK, new LayerInfo());
  game.renderer.createLayer(Layers.WEAPONS, new LayerInfo());
  game.renderer.createLayer(Layers.WALLS, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD_FRONT, new LayerInfo());
  game.renderer.createLayer(Layers.LIGHTING, new LayerInfo({ paralax: 0 }));
  game.renderer.createLayer(Layers.EMISSIVES, new LayerInfo());
  game.renderer.createLayer(Layers.VISION, new LayerInfo());
  game.renderer.createLayer(Layers.WORLD_OVERLAY, new LayerInfo());
  game.renderer.createLayer(Layers.HUD, new LayerInfo({ paralax: 0 }));
  game.renderer.createLayer(Layers.MENU, new LayerInfo({ paralax: 0 }));

  game.renderer.defaultLayer = Layers.WORLD;
}

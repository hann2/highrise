import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import DebugRenderer from "../core/graphics/DebugRenderer";
import FPSMeter from "../core/util/FPSMeter";
import { V } from "../core/Vector";
import Human from "./entities/Human";
import PlayerHumanController from "./entities/PlayerHumanController";
import Zombie from "./entities/Zombie";
import Wall from "./entities/Wall";
import { ContactMaterials } from "./P2Materials";
import Preloader from "./Preloader";

declare global {
  interface Window {
    DEBUG: { game?: Game };
  }
}

export async function main() {
  await new Promise((resolve) => window.addEventListener("load", resolve));

  const game = new Game({
    tickIterations: 1,
  });

  for (const contactMaterial of ContactMaterials) {
    game.world.addContactMaterial(contactMaterial);
  }

  window.DEBUG = { game };
  game.start();

  const preloader = game.addEntity(new Preloader());
  await preloader.waitTillLoaded();

  game.world.frictionGravity = 10; // TODO: Tune this
  game.addEntity(new AutoPauser());
  game.addEntity(new DebugRenderer());
  game.addEntity(new FPSMeter());
  // So we don't remove the html from the screen until we've actually hopefully rendered the table
  preloader.destroy();

  // TODO: Add actual stuff here

  game.camera.center(V(0, 0));
  game.camera.z = 10;
  const human = game.addEntity(new Human(V(0, 0)));
  game.addEntity(new PlayerHumanController(human));
  game.addEntity(new Zombie(V(10, 30)));
  game.addEntity(new Wall(5, 5));
}

import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import { ContactMaterials } from "./P2Materials";
import Preloader from "./Preloader";
import DebugRenderer from "../core/graphics/DebugRenderer";
import { HelloWorld } from "./entities/HelloWorld";
import { V } from "../core/Vector";
import FPSMeter from "../core/util/FPSMeter";

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

  game.camera.center(V(100, 10));
  game.camera.z = 2;
  game.addEntity(new HelloWorld());
}

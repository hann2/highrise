import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import FPSMeter from "../core/util/FPSMeter";
import { V } from "../core/Vector";
import TestMap from "./entities/TestMap";
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
    tickIterations: 4,
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
  game.addEntity(new FPSMeter());
  // So we don't remove the html from the screen until we've actually hopefully rendered the table
  preloader.destroy();

  // TODO: Add actual stuff here

  game.camera.center(V(0, 0));
  game.camera.z = 20;
  game.addEntity(new TestMap());
}

import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import FPSMeter from "../core/util/FPSMeter";
import { V } from "../core/Vector";
import Level1 from "./data/levels/lvl1";
import AIHumanController from "./entities/AIHumanController";
import Pistol from "./entities/guns/Pistol";
import Rifle from "./entities/guns/Rifle";
import Shotgun from "./entities/guns/Shotgun";
import Human from "./entities/Human";
import Party from "./entities/Party";
import PlayerHumanController from "./entities/PlayerHumanController";
import { ContactMaterials } from "./P2Materials";
import Preloader from "./Preloader";
import CameraController from "./entities/CameraController";
import { choose } from "../core/util/Random";

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
  game.world.frictionGravity = 10;

  for (const contactMaterial of ContactMaterials) {
    game.world.addContactMaterial(contactMaterial);
  }

  window.DEBUG = { game };
  game.start();

  const preloader = game.addEntity(new Preloader());
  await preloader.waitTillLoaded();
  preloader.destroy();

  game.addEntity(new AutoPauser());
  game.addEntity(new FPSMeter());

  const player = new Human(V(5, 5));
  player.gun = choose(new Rifle(), new Shotgun(), new Pistol());
  const george = new Human(V(6.5, 5));
  george.gun = choose(new Rifle(), new Shotgun(), new Pistol());
  const georgia = new Human(V(5, 6.5));
  georgia.gun = choose(new Rifle(), new Shotgun(), new Pistol());

  game.camera.center(player.getPosition());

  const entities = [
    player,
    player.gun,
    george,
    george.gun,
    georgia,
    georgia.gun,
    new PlayerHumanController(player),
    new AIHumanController(george, player),
    new AIHumanController(georgia, player),
    new CameraController(game.camera, player),
  ];

  const startingParty = new Party(entities);

  const level = new Level1();
  game.addEntity(startingParty);
  game.addEntity(level);
  level.placeEntities(startingParty);
}

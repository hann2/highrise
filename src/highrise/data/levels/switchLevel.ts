import Game from "../../../core/Game";
import { choose, rInteger } from "../../../core/util/Random";
import { V } from "../../../core/Vector";
import AIHumanController from "../../entities/AIHumanController";
import CameraController from "../../entities/CameraController";
import Pistol from "../../entities/guns/Pistol";
import Rifle from "../../entities/guns/Rifle";
import Shotgun from "../../entities/guns/Shotgun";
import Human from "../../entities/Human";
import Party from "../../entities/Party";
import PlayerHumanController from "../../entities/PlayerHumanController";
import Level from "./Level";
import Level1 from "./lvl1";
import Level2 from "./lvl2";
import TestLevelGenerator from "./TestLevelGenerator";

export const newGame = (game: Game) => {
  const oldParty = [...game.entities.all].filter((e) => e instanceof Party)[0];
  oldParty?.destroy();

  const player = new Human(V(5, 5));
  player.giveGun(choose(new Rifle(), new Shotgun(), new Pistol()));
  const george = new Human(V(6.5, 5));
  george.giveGun(choose(new Rifle(), new Shotgun(), new Pistol()));
  const georgia = new Human(V(5, 6.5));
  georgia.giveGun(choose(new Rifle(), new Shotgun(), new Pistol()));

  game!.camera.center(player.getPosition());

  const entities = [
    player,
    george,
    georgia,
    new PlayerHumanController(player),
    new AIHumanController(george, player),
    new AIHumanController(georgia, player),
    new CameraController(game!.camera, player),
  ];

  const startingParty = new Party(entities);
  game!.addEntity(startingParty);

  goToLevel(game!, 1, startingParty);
};

export const goToNextLevel = (game: Game) => {
  const oldLevel = game.entities.getByFilter(
    (e): e is Level => e instanceof Level
  )[0];
  const party = game.entities.getByFilter(
    (e): e is Party => e instanceof Party
  )[0];
  const newLevelIndex = oldLevel.index + 1;
  goToLevel(game, newLevelIndex, party);
};

export const goToLevel = (game: Game, index: number, party: Party) => {
  const oldLevel = [...game.entities.all].filter(
    (e) => e instanceof Level
  )[0] as Level;
  const newLevel = new TestLevelGenerator().generateLevel(
    party,
    rInteger(1, 2000000)
  );
  // newLevel.placeParty(party);
  game.addEntity(newLevel);
  oldLevel?.destroy();
};

const buildLevel = (levelIndex: number) => {
  switch (levelIndex) {
    case 1:
      return new Level1();
    case 2:
      return new Level2();
  }
  throw new Error("Level " + levelIndex + " does not exist");
};

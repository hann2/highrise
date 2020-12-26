import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { Persistence } from "../constants/constants";
import PartyManager from "../environment/PartyManager";
import { AmmoOverlay } from "../hud/AmmoOverlay";
import { DamagedOverlay } from "../hud/DamagedOverlay";
import PlayerHumanController from "../human/PlayerHumanController";
import LightingManager from "../lighting-and-vision/LightingManager";
import VisionController from "../lighting-and-vision/VisionController";
import GameOverScreen from "../menu/GameOverScreen";
import MainMenu from "../menu/MainMenu";
import PauseMenu from "../menu/PauseMenu";
import CameraController from "./CameraController";
import LevelController from "./LevelController";

// The most top level class for deciding control flow
export class GameController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;

  constructor() {
    super();
  }

  handlers = {
    goToMainMenu: () => {
      console.log("go to main menu");
      const game = this.game!;
      game.clearScene(Persistence.Menu);
      game.addEntity(new MainMenu());
    },

    newGame: () => {
      console.log("new game");
      const game = this.game!;
      const partyManager = game.addEntity(new PartyManager());
      const getPlayer = () => partyManager.leader;
      game.addEntity(new LevelController());
      game.addEntity(new CameraController(game.camera, getPlayer));
      game.addEntity(new PlayerHumanController(getPlayer));
      game.addEntity(new VisionController(getPlayer));
      game.addEntity(new DamagedOverlay(getPlayer));
      game.addEntity(new AmmoOverlay(getPlayer));
      game.addEntity(new LightingManager());
      game.addEntity(new PauseMenu());
    },

    gameOver: async () => {
      console.log("game over");
      const game = this.game!;

      const gameOverScreen = game.addEntity(new GameOverScreen());
      await this.waitUntil(() => gameOverScreen.sprite.alpha > 0.99);
      game.clearScene(Persistence.Game);
      await this.waitUntil(() => gameOverScreen.isDestroyed);
      game.dispatch({ type: "goToMainMenu" });
    },
  };
}

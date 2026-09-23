import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { Character } from "../characters/Character";
import { Persistence } from "../constants/constants";
import PartyManager from "../environment/PartyManager";
import { AmmoOverlay } from "../hud/AmmoOverlay";
import { DamagedOverlay } from "../hud/DamagedOverlay";
import { KeycardOverlay } from "../hud/KeycardOverlay";
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

  @on("goToMainMenu")
  onGoToMainMenu() {
    const game = this.game;
    game.clearScene(Persistence.Menu);
    game.addEntity(new MainMenu());
  }

  @on("newGame")
  onNewGame({ character }: { character: Character }) {
    const game = this.game;
    // Humans carry lights, so this has to exist before the party does
    game.addEntity(new LightingManager());
    const partyManager = game.addEntity(new PartyManager(character));
    const getPlayer = () => partyManager.leader;
    game.addEntities(
      new LevelController(),
      new CameraController(game.camera, getPlayer),
      new PlayerHumanController(getPlayer),
      new VisionController(getPlayer),
      new DamagedOverlay(getPlayer),
      new AmmoOverlay(getPlayer),
      new KeycardOverlay(getPlayer),
      new PauseMenu(),
    );
  }

  @on("gameOver")
  async onGameOver({ victory }: { victory: boolean }) {
    const game = this.game;

    const gameOverScreen = game.addEntity(new GameOverScreen(victory));
    await this.waitUntil(() => gameOverScreen.opacity > 0.99);
    game.clearScene(Persistence.Game);
    await this.waitUntil(() => gameOverScreen.isDestroyed);
    game.dispatch("goToMainMenu", undefined);
  }
}

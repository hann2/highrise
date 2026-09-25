import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { Character } from "../characters/Character";
import { Persistence } from "../constants/constants";
import EncyclopediaTracker from "../encyclopedia/EncyclopediaTracker";
import PartyManager from "../environment/PartyManager";
import FireGrid from "../fire/FireGrid";
import { AmmoOverlay } from "../hud/AmmoOverlay";
import { DamagedOverlay } from "../hud/DamagedOverlay";
import { HealthBar } from "../hud/HealthBar";
import InteractPrompt from "../hud/InteractPrompt";
import { KeycardOverlay } from "../hud/KeycardOverlay";
import { QuarterCounter } from "../hud/QuarterCounter";
import PlayerHumanController from "../human/PlayerHumanController";
import LightingManager from "../lighting-and-vision/LightingManager";
import VisionController from "../lighting-and-vision/VisionController";
import GameOverScreen from "../menu/GameOverScreen";
import PauseMenu from "../menu/PauseMenu";
import Lobby from "../lobby/Lobby";
import TitleScreen from "../menu/TitleScreen";
import { loadSaveData, setLastCharacter } from "../persistence/SaveData";
import { RunPlan } from "../run/RunPlan";
import RunStats from "../run/RunStats";
import AmmoDropper from "./AmmoDropper";
import CameraController from "./CameraController";
import LevelController from "./LevelController";
import QuarterDropper from "./QuarterDropper";

// The most top level class for deciding control flow
export class GameController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;

  /** Between runs: the lobby, which is also the main menu. At boot, the title comes first. */
  @on("goToLobby")
  onGoToLobby({ showTitle }: { showTitle: boolean }) {
    const game = this.game;
    game.clearScene(Persistence.Menu);
    if (showTitle) {
      game.addEntity(
        new TitleScreen(() => game.addEntity(new Lobby("fromTitle"))),
      );
    } else {
      game.addEntity(new Lobby("afterRun"));
    }
  }

  @on("newGame")
  onNewGame({ character, plan }: { character: Character; plan: RunPlan }) {
    const game = this.game;
    setLastCharacter(character.name);
    // Humans carry lights, so this has to exist before the party does
    game.addEntity(new LightingManager());
    const partyManager = game.addEntity(new PartyManager(character));
    const getPlayer = () => partyManager.leader;
    game.addEntities(
      new RunStats(character),
      new EncyclopediaTracker(),
      new QuarterDropper(),
      new AmmoDropper(),
      // Before the level starts, so it's sized to it
      new FireGrid(),
      new LevelController(plan),
      new CameraController(game.camera, getPlayer),
      new PlayerHumanController(getPlayer),
      new VisionController(getPlayer),
      new DamagedOverlay(getPlayer),
      new AmmoOverlay(getPlayer),
      new HealthBar(getPlayer),
      new QuarterCounter(),
      new KeycardOverlay(getPlayer),
      new InteractPrompt(getPlayer),
      new PauseMenu(),
    );
  }

  @on("gameOver")
  async onGameOver({ victory }: { victory: boolean }) {
    const game = this.game;

    // The summary has to be taken before the game is cleared away
    const previousBestFloor = loadSaveData().bestFloor;
    const summary = game.entities.getSingleton(RunStats).finish(victory);
    const gameOverScreen = game.addEntity(
      new GameOverScreen(summary, previousBestFloor),
    );
    await this.waitUntil(() => gameOverScreen.opacity > 0.99);
    game.clearScene(Persistence.Game);
    await this.waitUntil(() => gameOverScreen.isDestroyed);
    game.dispatch("goToLobby", { showTitle: false });
  }
}

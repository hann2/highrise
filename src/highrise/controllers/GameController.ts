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
import ContactShadows from "../lighting-and-vision/ContactShadows";
import VisionController from "../lighting-and-vision/VisionController";
import GameOverScreen from "../menu/GameOverScreen";
import PauseMenu from "../menu/PauseMenu";
import Lobby, { getStartingCharacter } from "../lobby/Lobby";
import TitleScreen from "../menu/TitleScreen";
import { loadSaveData, setLastCharacter } from "../persistence/SaveData";
import { RunPlan } from "../run/RunPlan";
import RunStats from "../run/RunStats";
import AmmoDropper from "./AmmoDropper";
import CameraController from "./CameraController";
import LevelController, { isTutorialComplete } from "./LevelController";
import QuarterDropper from "./QuarterDropper";
import BossRewards from "./BossRewards";

// The most top level class for deciding control flow
export class GameController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;

  /**
   * Between runs: the lobby, which is also the main menu. At boot, the title
   * comes first, and then the tutorial if it hasn't been played yet.
   */
  @on("goToLobby")
  onGoToLobby({ from }: { from: "boot" | "tutorial" | "run" }) {
    const game = this.game;
    game.clearScene(Persistence.Menu);
    if (from === "boot") {
      game.addEntity(
        new TitleScreen(() => {
          if (isTutorialComplete()) {
            game.addEntity(new Lobby("fromTitle"));
          } else {
            game.dispatch("startTutorial", undefined);
          }
        }),
      );
    } else {
      // Out of the tutorial is the first time up, so it's the long ride
      game.addEntity(new Lobby(from === "tutorial" ? "fromTitle" : "afterRun"));
    }
  }

  /** The tutorial is a floor 0 played like a run, as whoever starts in the lobby */
  @on("startTutorial")
  onStartTutorial() {
    this.startRun(getStartingCharacter(), [], 0);
  }

  @on("newGame")
  onNewGame({
    character,
    plan,
    startFloor,
    practice = false,
  }: {
    character: Character;
    plan: RunPlan;
    startFloor?: number;
    practice?: boolean;
  }) {
    if (!practice) {
      setLastCharacter(character.name);
    }
    this.startRun(character, plan, startFloor ?? 1, practice);
  }

  /**
   * Sets up everything a run (or the tutorial, at floor 0) needs. A practice
   * run (the boss test scene) keeps no score, marks nothing seen in the
   * encyclopedia and has no pause menu: the scene has its own keys.
   */
  private startRun(
    character: Character,
    plan: RunPlan,
    startFloor: number,
    practice = false,
  ) {
    const game = this.game;
    // Humans carry lights, so this has to exist before the party does
    game.addEntity(new LightingManager());
    game.addEntity(new ContactShadows());
    const partyManager = game.addEntity(new PartyManager(character));
    const getPlayer = () => partyManager.leader;
    if (!practice) {
      game.addEntities(new RunStats(character), new EncyclopediaTracker());
    }
    game.addEntities(
      new QuarterDropper(),
      new BossRewards(),
      new AmmoDropper(),
      // Before the level starts, so it's sized to it
      new FireGrid(),
      new LevelController(plan, startFloor, practice),
      new CameraController(game.camera, getPlayer),
      new PlayerHumanController(getPlayer),
      new VisionController(getPlayer),
      new DamagedOverlay(getPlayer),
      new AmmoOverlay(getPlayer),
      new HealthBar(getPlayer),
      new QuarterCounter(),
      new KeycardOverlay(getPlayer),
      new InteractPrompt(getPlayer),
    );
    // Last, so it's over the HUD
    if (!practice) {
      game.addEntity(new PauseMenu(startFloor === 0 ? "tutorial" : "run"));
    }
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
    game.dispatch("goToLobby", { from: "run" });
  }
}

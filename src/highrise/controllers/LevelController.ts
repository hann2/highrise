import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { Persistence } from "../constants/constants";
import FadeEffect from "../effects/FadeEffect";
import PartyManager from "../environment/PartyManager";
import AllyHumanController from "../human/AllyController";
import Human from "../human/Human";
import PlayerHumanController from "../human/PlayerHumanController";
import { Level } from "../levels/Level";
import {
  chooseTemplate,
  generateLevel,
} from "../levels/level-generation/levelGeneration";
import MainMenu from "../menu/MainMenu";
import PauseMenu from "../menu/PauseMenu";

const LEVEL_FADE_TIME = process.env.NODE_ENV === "development" ? 0.1 : 1.0;

// High level control flow for levels and the party
export default class LevelController extends BaseEntity implements Entity {
  id = "level_controller";
  persistenceLevel = Persistence.Game;
  currentLevel: number = 1;

  async onAdd() {
    this.currentLevel = 1;
    const level = generateLevel(chooseTemplate(this.currentLevel));

    await this.wait(0.0); // so that this happens async (why does that matter?)

    this.game?.dispatch({ type: "startLevel", level });
    this.game?.addEntity(new FadeEffect(0, 0, 1.5 * LEVEL_FADE_TIME));
  }

  handlers = {
    // We just got to the exit
    levelComplete: async () => {
      this.currentLevel += 1;

      const fadeOutTime = LEVEL_FADE_TIME;
      const fadeHoldTime = LEVEL_FADE_TIME / 2;
      const fadeInTime = LEVEL_FADE_TIME;
      this.game?.addEntity(
        new FadeEffect(fadeOutTime, fadeHoldTime, fadeInTime)
      );

      await this.wait(fadeOutTime);
      this.game?.clearScene(Persistence.Floor);
      const level = generateLevel(chooseTemplate(this.currentLevel));
      this.game?.dispatch({ type: "startLevel", level });
    },

    // We just started a new level
    startLevel: ({ level }: { level: Level }) => {
      this.game!.addEntities(level.entities);
    },

    // The whole party is dead
    partyDead: async () => {
      this.game?.dispatch({ type: "gameOver" });
    },
  };

  getPartyMembers() {
    return (this.game!.entities.getById("party_manager") as PartyManager)
      .partyMembers;
  }
}

export function getCurrentLevelNumber(game: Game): number {
  return (game.entities.getById("level_controller") as LevelController)
    .currentLevel;
}

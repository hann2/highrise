import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { PositionalSound } from "../../core/sound/PositionalSound";
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
  persistent = true;
  currentLevel: number = 1;

  handlers = {
    newGame: async () => {
      this.game!.clearScene();
      this.currentLevel = 1;
      const level = generateLevel(chooseTemplate(this.currentLevel));

      await this.wait(0.0); // so that this happens async
      this.game?.dispatch({ type: "startLevel", level });
      this.game?.addEntity(new FadeEffect(0, 0, 1.5 * LEVEL_FADE_TIME));
      this.game?.addEntity(new PauseMenu());
    },

    levelComplete: async () => {
      this.currentLevel += 1;

      this.game?.addEntity(
        new FadeEffect(LEVEL_FADE_TIME, LEVEL_FADE_TIME / 2, LEVEL_FADE_TIME)
      );

      await this.wait(LEVEL_FADE_TIME);
      this.clearLevel();
      const level = generateLevel(chooseTemplate(this.currentLevel));
      this.game?.dispatch({ type: "startLevel", level });
    },

    startLevel: ({ level }: { level: Level }) => {
      this.game!.addEntities(level.entities);
    },

    gameOver: async () => {
      this.game!.addEntity(
        new FadeEffect(LEVEL_FADE_TIME * 2, LEVEL_FADE_TIME, 0, 0x000000)
      );
      await this.wait(LEVEL_FADE_TIME * 2.5);
      this.game?.clearScene();
      this.game?.addEntity(new MainMenu());
    },
  };

  /** Remove all the old stuff from the old level */
  clearLevel() {
    for (const entity of this.game!.entities) {
      if (this.shouldClear(entity)) {
        entity.destroy();
      }
    }
  }

  getPartyMembers() {
    return (this.game!.entities.getById("party_manager") as PartyManager)
      .partyMembers;
  }

  /** Determines whether or not we should clear an entity */
  shouldClear(entity: Entity) {
    if (entity.persistent) {
      // Whatever is persistent we probably don't wanna delete it (like ourselves)
      return false;
    } else if (entity instanceof PositionalSound && !entity.continuous) {
      return false;
    } else if (entity instanceof PositionalSound) {
      return false;
    } else if (entity instanceof Human) {
      if (this.getPartyMembers().includes(entity)) {
        return false;
      } else {
        return true;
      }
    } else if (entity instanceof AllyHumanController) {
      return false;
    } else if (entity instanceof PlayerHumanController) {
      return false;
    } else if (entity.parent) {
      // Let parents do the clearing for things like guns and lights and whatever, so we don't have to keep track of stuff like whether guns in a player's inventory should be deleted
      return false;
    }
    return true;
  }
}

export function getCurrentLevelNumber(game: Game): number {
  return (game.entities.getById("level_controller") as LevelController)
    .currentLevel;
}

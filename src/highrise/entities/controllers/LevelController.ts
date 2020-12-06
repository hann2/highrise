import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { Level } from "../../data/levels/Level";
import {
  chooseTemplate,
  generateLevel,
} from "../../data/levels/levelGeneration";
import FadeEffect from "../../effects/FadeEffect";
import Human from "../human/Human";
import PartyManager from "../PartyManager";
import AllyHumanController from "./AllyController";
import PlayerHumanController from "./PlayerHumanController";

interface PartyEvent {
  human: Human;
}

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
      this.game!.dispatch({ type: "startLevel", level });
      this.game?.addEntity(new FadeEffect(0, 0, 1.5));
    },

    levelComplete: async () => {
      this.getPartyLeader()?.speak("relief");
      this.currentLevel += 1;
      this.clearLevel();

      this.game?.addEntity(new FadeEffect(1, 0.5, 1));

      await this.wait(1.5);
      const level = generateLevel(chooseTemplate(this.currentLevel));
      this.game?.dispatch({ type: "startLevel", level });
    },

    startLevel: ({ level }: { level: Level }) => {
      this.game!.addEntities(level.entities);
    },

    gameOver: async () => {
      this.game!.addEntity(new FadeEffect(2.0, 1.001, 0, 0x0000ff));
      await this.wait(3);
      this.game!.dispatch({ type: "newGame" });
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

  getPartyLeader() {
    return (this.game!.entities.getById("party_manager") as PartyManager)
      .leader;
  }

  /** Determines whether or not we should clear an entity */
  shouldClear(entity: Entity) {
    if (entity.persistent) {
      // Whatever is persistent we probably don't wanna delete it (like the pause controller)
      return false;
    }
    if (entity instanceof PositionalSound && !entity.continuous) {
      return false;
    }
    if (entity instanceof Human) {
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

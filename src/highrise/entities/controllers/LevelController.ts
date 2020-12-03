import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { choose } from "../../../core/util/Random";
import TestLevelGenerator from "../../data/levels/TestLevelGenerator";
import Gun from "../guns/Gun";
import Pistol from "../guns/Pistol";
import Rifle from "../guns/Rifle";
import Shotgun from "../guns/Shotgun";
import Human from "../Human";
import Axe from "../meleeWeapons/Axe";
import MeleeWeapon from "../meleeWeapons/MeleeWeapon";
import AllyHumanController from "./AllyController";
import PlayerHumanController from "./PlayerHumanController";
import SurvivorHumanController from "./SurvivorHumanController";
import Katana from "../meleeWeapons/Katana";

interface PartyEvent {
  human: Human;
}

// High level control flow for levels and the party
export default class LevelController extends BaseEntity implements Entity {
  id = "level_controller";
  persistent = true;
  currentLevel: number = 1;
  partyMembers: Human[] = [];
  playerHumanController?: PlayerHumanController;
  levelGenerator = new TestLevelGenerator();

  constructor() {
    super();
  }

  handlers = {
    newGame: () => {
      console.log("newGame");
      this.game!.clearScene();
      this.currentLevel = 1;
      this.partyMembers = [];

      const player = this.game!.addEntity(new Human());
      player.giveWeapon(
        choose<Gun | MeleeWeapon>(
          new Axe()
          // new Katana()
          // new Pistol(),
          // new Rifle(),
          // new Shotgun()
        )
      );
      this.game!.dispatch({ type: "addToParty", human: player });
      this.setPlayerHuman(player);

      this.game!.dispatch({ type: "startLevel" });
    },

    levelComplete: () => {
      console.log("levelComplete");
      this.currentLevel += 1;
      this.clearLevel();

      this.game?.dispatch({ type: "startLevel" });
    },

    startLevel: () => {
      console.log("startLevel", this.currentLevel);
      const { entities, spawnLocations } = this.levelGenerator.generateLevel();
      this.game!.addEntities(entities);

      this.partyMembers.forEach((partyMember, i) => {
        partyMember.setPosition(spawnLocations[i]);
      });

      // TODO: Play sound
    },

    addToParty: ({
      human,
      survivorController,
    }: PartyEvent & { survivorController?: SurvivorHumanController }) => {
      console.log("addToParty");
      this.partyMembers.push(human);
      survivorController?.destroy();
      this.game!.addEntity(new AllyHumanController(human, this.playerHuman));
    },

    removeFromParty: ({ human }: PartyEvent) => {
      console.log("removeFromParty");
    },

    humanDied: ({ human }: PartyEvent) => {
      const indexInParty = this.partyMembers.indexOf(human);
      if (indexInParty >= 0) {
        this.partyMembers.splice(indexInParty, 1);
      }
      if (human === this.playerHuman) {
        if (this.partyMembers.length > 0) {
          this.setPlayerHuman(this.partyMembers[0]);
        } else {
          this.game!.dispatch({ type: "gameOver" });
        }
      }
    },

    gameOver: async () => {
      console.log("Game over, so sad");
      this.playerHumanController?.destroy();
      this.playerHumanController = undefined;

      await this.wait(2);

      this.game!.dispatch({ type: "newGame" });
    },
  };

  setPlayerHuman(playerHuman: Human) {
    if (!this.partyMembers.includes(playerHuman)) {
      throw new Error("Player must control a party member");
    }

    const oldPlayerHuman = this.playerHuman;

    if (!this.playerHumanController) {
      this.playerHumanController = this.addChild(
        new PlayerHumanController(playerHuman)
      );
    } else {
      this.playerHumanController.human = playerHuman;
    }

    if (oldPlayerHuman) {
      this.game!.addEntity(
        new AllyHumanController(oldPlayerHuman, playerHuman)
      );
    }

    for (const allyController of this.game!.entities.getTagged(
      "ally_controller"
    ) as AllyHumanController[]) {
      if (allyController.human === playerHuman) {
        allyController.destroy();
      } else {
        allyController.leader = playerHuman;
      }
    }
  }

  get playerHuman(): Human | undefined {
    return this.playerHumanController?.human;
  }

  /** Remove all the old stuff from the old level */
  clearLevel() {
    for (const entity of this.game!.entities) {
      if (this.shouldClear(entity)) {
        entity.destroy();
      }
    }
  }

  /** Determines whether or not we should clear an entity */
  shouldClear(entity: Entity) {
    if (entity.persistent) {
      // Whatever is persistent we probably don't wanna delete it (like the pause controller)
      return false;
    }
    if (entity instanceof Human) {
      if (this.partyMembers.includes(entity)) {
        return false;
      } else {
        return true;
      }
    } else if (entity instanceof Gun) {
      return false; // If we delete the parent it will delete the gun
    } else if (entity instanceof MeleeWeapon) {
      return false; // If we delete the parent it will delete the weapon
    } else if (entity instanceof AllyHumanController) {
      return false;
    } else if (entity instanceof PlayerHumanController) {
      return false;
    }
    return true;
  }
}

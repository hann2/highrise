import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { choose, rBool } from "../../core/util/Random";
import { Persistence } from "../constants/constants";
import AllyHumanController, { isAllyController } from "../human/AllyController";
import Human from "../human/Human";
import SurvivorHumanController from "../human/SurvivorHumanController";
import { Level } from "../levels/Level";
import SpawnLocation from "./SpawnLocation";

interface PartyEvent {
  human: Human;
}

// Keeps track of who's in the party
export default class PartyManager extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  id = "party_manager";

  partyMembers: Human[] = [];
  leader!: Human;

  onAdd(game: Game) {
    game.entities.addFilter(isAllyController);

    this.partyMembers = [];
    this.leader = game.addEntity(new Human());
    this.handlers.addToParty({ human: this.leader });
  }

  handlers = {
    addToParty: ({
      human,
      survivorController,
    }: PartyEvent & { survivorController?: SurvivorHumanController }) => {
      console.log("add to party");
      this.partyMembers.push(human);
      survivorController?.destroy();
      this.game!.addEntity(new AllyHumanController(human, () => this.leader));

      human.persistenceLevel = Persistence.Game;

      if (this.partyMembers.length > 1) {
        human.voice.speak("joinParty");
      }
    },

    levelComplete: () => {
      const speaker = choose(...this.partyMembers);
      speaker.voice.speak("relief");
    },

    startLevel: async ({ level }: { level: Level }) => {
      const spawnLocations = level.entities.filter(
        (entity): entity is SpawnLocation => entity instanceof SpawnLocation
      );

      this.partyMembers.forEach((partyMember, i) => {
        partyMember.setPosition(
          spawnLocations[i % spawnLocations.length].position
        );
      });

      await this.wait(2);
      const speaker = choose(...this.partyMembers);
      speaker.voice.speak(choose("newLevel", "misc"));
    },

    humanDied: ({ human }: PartyEvent) => {
      const indexInParty = this.partyMembers.indexOf(human);
      if (indexInParty >= 0) {
        this.partyMembers.splice(indexInParty, 1);
      }
      if (human === this.leader) {
        if (this.partyMembers.length > 0) {
          this.setLeader(this.partyMembers[0]);
        } else {
          this.game!.dispatch({ type: "partyDead" });
        }
      }
    },

    zombieDied: async ({ killer }: { killer: Human }) => {
      if (killer && this.hasMember(killer) && rBool(0.2)) {
        await this.wait(0.5);
        killer.voice.speak("taunts");
      }
    },
  };

  hasMember(human: Human) {
    return this.partyMembers.includes(human);
  }

  getAllyControllers() {
    return this.game!.entities.getByFilter(isAllyController);
  }

  setLeader(leader: Human) {
    if (!this.hasMember(leader)) {
      throw new Error("Leader must be in the party");
    }
    this.leader = leader;
  }
}

export function getPartyManager(game: Game): PartyManager | undefined {
  return game.entities.getById("party_manager") as PartyManager;
}

export function getPartyLeader(game: Game): Human | undefined {
  return getPartyManager(game)?.leader;
}

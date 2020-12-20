import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { choose, rBool } from "../../core/util/Random";
import { Level } from "../levels/Level";
import VisionController from "../lighting-and-vision/vision";
import AllyHumanController, { isAllyController } from "../human/AllyController";
import PlayerHumanController from "../human/PlayerHumanController";
import SurvivorHumanController from "../human/SurvivorHumanController";
import Human from "../human/Human";
import SpawnLocation from "./SpawnLocation";

interface PartyEvent {
  human: Human;
}

export default class PartyManager extends BaseEntity implements Entity {
  persistent = true;
  id = "party_manager";

  partyMembers: Human[] = [];
  leader!: Human;

  onAdd(game: Game) {
    game.entities.addFilter(isAllyController);
  }

  handlers = {
    newGame: () => {
      this.partyMembers = [];
      this.leader = this.game!.addEntity(new Human());
      this.game!.addEntity(new PlayerHumanController(() => this.leader));
      this.game!.addEntity(new VisionController());
      this.game?.dispatch({ type: "addToParty", human: this.leader });
    },

    addToParty: ({
      human,
      survivorController,
    }: PartyEvent & { survivorController?: SurvivorHumanController }) => {
      this.partyMembers.push(human);
      survivorController?.destroy();
      this.game!.addEntity(
        new AllyHumanController(human, () => this.leader, human !== this.leader)
      );

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
          this.game!.dispatch({ type: "gameOver" });
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

    for (const allyController of this.getAllyControllers()) {
      allyController.enabled = allyController.human != leader;
    }
  }
}

export function getPartyManager(game: Game): PartyManager | undefined {
  return game.entities.getById("party_manager") as PartyManager;
}

export function getPartyLeader(game: Game): Human | undefined {
  return getPartyManager(game)?.leader;
}
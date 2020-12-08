import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { choose, rBool } from "../../core/util/Random";
import { Level } from "../data/levels/Level";
import { Axe } from "../weapons/melee-weapons/Axe";
import { BaseballBat } from "../weapons/melee-weapons/BaseballBat";
import MeleeWeapon from "../weapons/MeleeWeapon";
import AllyHumanController from "./controllers/AllyController";
import PlayerHumanController from "./controllers/PlayerHumanController";
import SurvivorHumanController from "./controllers/SurvivorHumanController";
import Human from "./human/Human";
import SpawnLocation from "./SpawnLocation";

interface PartyEvent {
  human: Human;
}

export default class PartyManager extends BaseEntity implements Entity {
  persistent = true;
  id = "party_manager";

  partyMembers: Human[] = [];
  leader!: Human;

  handlers = {
    newGame: () => {
      this.partyMembers = [];
      this.leader = this.game!.addEntity(new Human());
      this.game!.addEntity(new PlayerHumanController(() => this.leader));
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
        human.speak("joinParty");
      }
    },

    levelComplete: () => {
      const speaker = choose(...this.partyMembers);
      speaker.speak("relief");
    },

    startLevel: async ({ level }: { level: Level }) => {
      const spawnLocations = level.entities.filter(
        (entity): entity is SpawnLocation => entity instanceof SpawnLocation
      );

      this.partyMembers.forEach((partyMember, i) => {
        partyMember.setPosition(spawnLocations[i].position);
      });

      await this.wait(2);
      const speaker = choose(...this.partyMembers);
      speaker.speak(choose("newLevel", "misc"));
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

    zombieDied: async () => {
      if (rBool(1 / 10)) {
        await this.wait(0.5);
        const speaker = choose(...this.partyMembers);
        speaker.speak("taunts");
      }
    },
  };

  hasMember(human: Human) {
    return this.partyMembers.includes(human);
  }

  getAllyControllers() {
    return this.game?.entities.getTagged(
      "ally_controller"
    ) as AllyHumanController[];
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

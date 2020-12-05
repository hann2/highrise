import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { choose } from "../../core/util/Random";
import { Level } from "../data/levels/Level";
import AllyHumanController from "./controllers/AllyController";
import PlayerHumanController from "./controllers/PlayerHumanController";
import SurvivorHumanController from "./controllers/SurvivorHumanController";
import { GUNS } from "./guns/Guns";
import Human from "./human/Human";

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
      this.leader.giveWeapon(new (choose(...GUNS))());
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
    },

    startLevel: ({ level }: { level: Level }) => {
      this.partyMembers.forEach((partyMember, i) => {
        partyMember.setPosition(level.spawnLocations[i]);
      });
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
    const oldLeader = this.leader;
    this.leader = leader;

    for (const allyController of this.getAllyControllers()) {
      allyController.enabled = allyController.human != leader;
    }
  }
}

import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { choose, rBool } from "../../core/util/Random";
import { Character, setCharactersInUse } from "../characters/Character";
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

  partyMembers: Human[] = [];
  leader!: Human;

  constructor(private startingCharacter: Character) {
    super();
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    game.entities.addFilter(isAllyController);

    this.partyMembers = [];
    this.leader = game.addEntity(new Human(undefined, this.startingCharacter));
    this.onAddToParty({ human: this.leader });
  }

  @on("destroy")
  onDestroy() {
    setCharactersInUse([]);
  }

  @on("addToParty")
  onAddToParty({
    human,
    survivorController,
  }: PartyEvent & { survivorController?: SurvivorHumanController }) {
    this.partyMembers.push(human);
    setCharactersInUse(this.partyMembers.map((member) => member.character));
    survivorController?.destroy();
    this.game.addEntity(new AllyHumanController(human, () => this.leader));

    human.persistenceLevel = Persistence.Game;

    if (this.partyMembers.length > 1) {
      human.voice.speak("joinParty");
    }
  }

  @on("levelComplete")
  onLevelComplete() {
    const speaker = choose(...this.partyMembers);
    speaker.voice.speak("relief");
  }

  @on("startLevel")
  async onStartLevel({ level }: { level: Level }) {
    const spawnLocations = level.entities.filter(
      (entity): entity is SpawnLocation => entity instanceof SpawnLocation,
    );

    this.partyMembers.forEach((partyMember, i) => {
      partyMember.setPosition(
        spawnLocations[i % spawnLocations.length].position,
      );
    });

    await this.wait(2);
    const speaker = choose(...this.partyMembers);
    speaker.voice.speak(choose("newLevel", "misc"));
  }

  @on("humanDied")
  onHumanDied({ human }: PartyEvent) {
    const indexInParty = this.partyMembers.indexOf(human);
    if (indexInParty >= 0) {
      this.partyMembers.splice(indexInParty, 1);
      setCharactersInUse(this.partyMembers.map((member) => member.character));
    }
    if (human === this.leader) {
      if (this.partyMembers.length > 0) {
        this.setLeader(this.partyMembers[0]);
      } else {
        this.game.dispatch("partyDead", undefined);
      }
    }
  }

  @on("zombieDied")
  async onZombieDied({ killer }: { killer?: Human }) {
    if (killer && this.hasMember(killer) && rBool(0.2)) {
      await this.wait(0.5);
      killer.voice.speak("taunts");
    }
  }

  /** Quarters are shared by the whole party */
  quarters = 0;

  addQuarters(amount: number) {
    this.quarters += amount;
    this.game.dispatch("quartersCollected", { amount });
  }

  /** Takes `amount` quarters if the party has that many. */
  spendQuarters(amount: number): boolean {
    if (this.quarters < amount) {
      return false;
    }
    this.quarters -= amount;
    this.game.dispatch("quartersSpent", { amount });
    return true;
  }

  hasMember(human: Human) {
    return this.partyMembers.includes(human);
  }

  getAllyControllers() {
    return this.game.entities.getByFilter(isAllyController);
  }

  setLeader(leader: Human) {
    if (!this.hasMember(leader)) {
      throw new Error("Leader must be in the party");
    }
    this.leader = leader;
  }
}

export function getPartyManager(game?: Game): PartyManager | undefined {
  return game?.entities.getByConstructor(PartyManager)[0];
}

export function getPartyLeader(game?: Game): Human | undefined {
  return getPartyManager(game)?.leader;
}

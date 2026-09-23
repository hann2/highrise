import { SoundName } from "../../../resources/resources";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { choose, rBool } from "../../core/util/Random";
import { Character, setCharactersInUse } from "../characters/Character";
import { Persistence } from "../constants/constants";
import SurvivorToast from "../hud/SurvivorToast";
import AllyHumanController, { isAllyController } from "../human/AllyController";
import Human from "../human/Human";
import SurvivorHumanController from "../human/SurvivorHumanController";
import { Level } from "../levels/Level";
import { unlockCharacter } from "../persistence/SaveData";
import { getRunStats } from "../run/RunStats";
import Exit from "./Exit";
import SpawnLocation from "./SpawnLocation";
import Stairwell from "./Stairwell";

interface PartyEvent {
  human: Human;
}

// Without an exit stairwell on the floor, allies this close to the leader make it out
const MAKE_IT_OUT_DISTANCE = 3;
// How long someone who made it out takes to fade away on the stairs
const MAKE_IT_OUT_FADE_TIME = 0.8;
// Seconds between the relief lines of everyone who made it out, so they don't talk over each other
const RELIEF_STAGGER = 0.6;

/**
 * Keeps track of who's in the party: the leader, who the player controls, and
 * any survivors who have joined for the rest of the floor. Survivors who are in
 * the exit stairwell when the floor is done make it out and are unlocked as
 * playable characters; the rest are left behind. When the leader dies the run
 * is over.
 */
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

    this.leader = game.addEntity(new Human(undefined, this.startingCharacter));
    this.leader.persistenceLevel = Persistence.Game;
    this.partyMembers = [this.leader];
    setCharactersInUse([this.startingCharacter]);
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
    if (this.hasMember(human)) {
      return;
    }
    this.partyMembers.push(human);
    this.updateCharactersInUse();
    survivorController?.destroy();
    // Allies stay Floor-persistent: they only come along for this floor
    this.game.addEntity(new AllyHumanController(human, () => this.leader));
    human.voice.speak("joinParty");
  }

  @on("levelComplete")
  onLevelComplete() {
    const allies = this.getAllies();
    const madeItOut = allies.filter((ally) => this.isMakingItOut(ally));

    // Everyone else is left behind, and goes when the floor is cleared away
    this.partyMembers = [this.leader];
    this.updateCharactersInUse();

    if (madeItOut.length === 0) {
      this.leader.voice.speak("relief");
      return;
    }

    const exit = this.game.entities.getByConstructor(Exit)[0];
    const runStats = getRunStats(this.game);
    for (const ally of madeItOut) {
      unlockCharacter(ally.character.name);
      runStats?.recordCharacterUnlocked(ally.character.name);
      this.leaveUpTheStairs(ally, exit);
    }

    // Everyone who has a line says it, one after another. Chosen now so that
    // what's said doesn't depend on when the next floor is generated.
    const reliefLines = madeItOut
      .map((ally) => ally.character.sounds.relief)
      .filter((lines) => lines.length > 0)
      .map((lines) => choose(...lines));
    if (reliefLines.length === 0) {
      this.leader.voice.speak("relief");
    }
    reliefLines.forEach((line, i) => this.sayRelief(line, i * RELIEF_STAGGER));
    this.game.addEntity(
      new SurvivorToast(madeItOut.map((ally) => ally.character.name)),
    );
  }

  /**
   * Plays a relief line after `delay` seconds. Not positional, and outlives
   * the floor, so it isn't cut off by the level change.
   */
  private async sayRelief(line: SoundName, delay: number) {
    if (delay > 0) {
      await this.wait(delay);
    }
    this.game.addEntity(
      new SoundInstance(line, { persistenceLevel: Persistence.Game }),
    );
  }

  /** Whether an ally is safe with the leader when the floor is done */
  private isMakingItOut(ally: Human): boolean {
    const position = ally.getPosition();
    const stairwells = this.game.entities.getByConstructor(Stairwell);
    if (stairwells.length > 0) {
      return stairwells.some((stairwell) => stairwell.contains(position));
    }
    return (
      position.distanceTo(this.leader.getPosition()) < MAKE_IT_OUT_DISTANCE
    );
  }

  /** Walks off up the stairs, fading out, until the floor is cleared away */
  private leaveUpTheStairs(ally: Human, exit: Exit | undefined) {
    const controller = [...this.getAllyControllers()].find(
      (c) => c.human === ally,
    );
    if (exit) {
      controller?.leaveVia(exit.getPosition());
    }
    // Their light would stay behind on the stairs as they fade
    ally.flashlight.light.enabled = false;
    const sprite = ally.humanSprite.sprite;
    this.wait(MAKE_IT_OUT_FADE_TIME, (_, t) => {
      if (!ally.isDestroyed) {
        sprite.alpha = 1 - t;
      }
    });
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
  async onHumanDied({ human }: PartyEvent) {
    if (human === this.leader) {
      // Survivors aren't extra lives. Waits until everyone has handled the
      // death, since the run summary (taken on game over) wants its cause.
      await this.wait(0);
      this.game.dispatch("partyDead", undefined);
      return;
    }
    const indexInParty = this.partyMembers.indexOf(human);
    if (indexInParty >= 0) {
      this.partyMembers.splice(indexInParty, 1);
      this.updateCharactersInUse();
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

  /** Everyone in the party but the leader */
  getAllies(): Human[] {
    return this.partyMembers.filter((member) => member !== this.leader);
  }

  getAllyControllers() {
    return this.game.entities.getByFilter(isAllyController);
  }

  private updateCharactersInUse() {
    setCharactersInUse(this.partyMembers.map((member) => member.character));
  }
}

export function getPartyManager(game?: Game): PartyManager | undefined {
  return game?.entities.getByConstructor(PartyManager)[0];
}

export function getPartyLeader(game?: Game): Human | undefined {
  return getPartyManager(game)?.leader;
}

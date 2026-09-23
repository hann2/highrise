import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { reseedIfSeeded } from "../../core/util/Random";
import { Texture } from "pixi.js";
import { V2d } from "../../core/Vector";
import { Character, CHARACTERS } from "../characters/Character";
import { CELL_SIZE, Persistence } from "../constants/constants";
import CameraController from "../controllers/CameraController";
import FadeEffect from "../effects/FadeEffect";
import ElevatorDoor from "../environment/ElevatorDoor";
import Exit from "../environment/Exit";
import Interactable from "../environment/Interactable";
import Human from "../human/Human";
import PlayerHumanController from "../human/PlayerHumanController";
import InteractPrompt from "../hud/InteractPrompt";
import CellGrid from "../levels/level-generation/CellGrid";
import { generateLobby } from "../levels/level-generation/lobbyGeneration";
import {
  ARRIVAL_ELEVATOR,
  BOOKCASE_POSITION,
  CHARACTER_SPOTS,
  LOBBY_SIZE,
  RECEPTIONIST_POSITION,
  STAIRS_CELL,
} from "../levels/rooms/LobbyRoomTemplate";
import LightingManager from "../lighting-and-vision/LightingManager";
import VisionController from "../lighting-and-vision/VisionController";
import { isCreditsOpen } from "../menu/CreditsScreen";
import Encyclopedia, { isEncyclopediaOpen } from "../menu/Encyclopedia";
import PauseMenu from "../menu/PauseMenu";
import TitleScreen, { isTitleScreenOpen } from "../menu/TitleScreen";
import { loadSaveData, updateSaveData } from "../persistence/SaveData";
import { generateRunPlan, RunPlan } from "../run/RunPlan";
import { Direction } from "../utils/directions";
import LobbyCharacterController from "./LobbyCharacterController";
import ReceptionistBob from "./ReceptionistBob";

/** Offset from the base seed for the lobby and the run plan (levels use 0 up) */
const LOBBY_SEED_OFFSET = 1000;
/** After a run, how long the player stands in the elevator before it opens */
const RETURN_OPEN_DELAY = 0.8;
const RETURN_FADE_IN_TIME = 1.0;
const START_RUN_FADE_TIME = process.env.NODE_ENV === "development" ? 0.1 : 0.8;
/** How far the elevator doors have to be open before the player can move */
const DOORS_OPEN_ENOUGH = 0.4;
/** How often the save is checked for newly rescued characters, so the unlock cheat shows up (seconds) */
const UNLOCK_CHECK_INTERVAL = 0.5;
/** How often what's been seen of the lobby is saved, in case the page is closed (seconds) */
const EXPLORED_SAVE_INTERVAL = 10;

const at = (cell: V2d) => CellGrid.levelCoordToWorldCoord(cell);

/**
 * The hub between runs, and the diegetic main menu. The player arrives in an
 * elevator (behind the title when the game boots), walks out into the lobby,
 * picks who to be by walking up to them, and takes the stairs to start the
 * run. (What the run holds is a mystery until the second floor's directory.)
 */
export default class Lobby extends BaseEntity implements Entity {
  id = "lobby";
  persistenceLevel = Persistence.Game;

  /** The run the stairs lead to */
  plan!: RunPlan;
  /** Who the player is right now */
  player!: Human;
  arrivalDoor!: ElevatorDoor;
  /** The elevator has opened and the player can move */
  arrived = false;
  /** Took the stairs; the run is about to start */
  leaving = false;
  /** How many of the character spots have someone in them */
  private spotsUsed = 0;
  private unlockCheckTime = UNLOCK_CHECK_INTERVAL;
  /** Fog of war, remembered between visits and page loads */
  private vision!: VisionController;
  private exploredSaveTime = EXPLORED_SAVE_INTERVAL;

  constructor(private showTitle: boolean) {
    super();
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    // So seeded runs get the same lobby and plan whatever happened before
    reseedIfSeeded(LOBBY_SEED_OFFSET);
    this.plan = generateRunPlan();

    // Humans carry lights, so this has to exist before anyone is added
    this.addChild(new LightingManager());
    const lobby = generateLobby();
    this.arrivalDoor = lobby.arrivalDoor;
    this.addChildren(...lobby.entities);

    const character = getStartingCharacter();
    this.player = this.addChild(
      new Human(at(ARRIVAL_ELEVATOR.cell), character),
    );
    this.player.body.angle = Direction[ARRIVAL_ELEVATOR.openDirection].angle;
    this.addWaitingCharacters(character);
    this.vision = this.addChild(new VisionController(() => this.player));
    this.restoreExplored();

    const stairs = at(STAIRS_CELL);
    const half = CELL_SIZE / 2;
    const bookcase = new Interactable(
      at(BOOKCASE_POSITION),
      () => this.openEncyclopedia(),
      1.8,
    );
    bookcase.prompt = () => ({
      title: "Encyclopedia",
      action: "to read",
    });
    const exit = new Exit(
      stairs.x - half,
      stairs.y - half,
      stairs.x + half,
      stairs.y + half,
      Direction.UP.angle,
      (human) => {
        if (human === this.player) {
          this.startRun();
        }
      },
    );
    exit.interactable.prompt = () => ({
      title: "Stairs up",
      hint: "Start the run",
    });
    this.addChildren(
      exit,
      new ReceptionistBob(at(RECEPTIONIST_POSITION), () => this.player),
      bookcase,
      new CameraController(game.camera, () => this.player),
      new PlayerHumanController(
        () => this.player,
        () => this.isInputBlocked(),
      ),
      new InteractPrompt(
        () => this.player,
        () => !this.arrived || this.leaving || isTitleScreenOpen(this.game),
        "large",
      ),
    );

    if (this.showTitle) {
      this.addChild(new TitleScreen(() => this.openElevator()));
    } else {
      this.arriveAfterRun();
    }
  }

  /** Everyone rescued so far stands around the lobby; the rest aren't here yet */
  private addWaitingCharacters(current: Character) {
    for (const character of getUnlockedCharacters()) {
      if (character !== current) {
        this.addNewArrival(character);
      }
    }
  }

  /** Stands a character in the next free spot, looking at the elevator */
  private addNewArrival(character: Character) {
    const spot = at(CHARACTER_SPOTS[this.spotsUsed % CHARACTER_SPOTS.length]);
    this.spotsUsed += 1;
    const human = this.addChild(new Human(spot, character));
    // Waiting to see who comes out of the elevator
    human.body.angle = at(ARRIVAL_ELEVATOR.cell).sub(spot).angle;
    this.addWaiting(human, spot);
  }

  /** Anyone rescued since the lobby was built (the unlock cheat) turns up */
  private addNewlyUnlocked() {
    const present = new Set([
      this.player.character,
      ...this.game.entities
        .getTagged("lobby_character")
        .map((c) => (c as LobbyCharacterController).human.character),
    ]);
    for (const character of getUnlockedCharacters()) {
      if (!present.has(character)) {
        this.addNewArrival(character);
      }
    }
  }

  private addWaiting(human: Human, home: V2d) {
    this.addChild(
      new LobbyCharacterController(
        human,
        home,
        () => this.player,
        (controller) => this.playAs(controller),
      ),
    );
  }

  /** Swaps the player into someone waiting; who they were waits where they left them */
  playAs(controller: LobbyCharacterController) {
    if (this.leaving || this.isInputBlocked()) {
      return;
    }
    const previous = this.player;
    const human = controller.human;
    controller.destroy();
    this.player = human;
    human.flashlight.light.enabled = previous.flashlight.light.enabled;
    this.addWaiting(previous, previous.getPosition().clone());

    // Not everyone has lines for everything
    const lines = (["misc", "newLevel", "joinParty"] as const).find(
      (soundClass) => human.character.sounds[soundClass].length > 0,
    );
    if (lines) {
      human.voice.speak(lines, true);
    }
  }

  /** What has been seen of the lobby so far, from the save; nothing the first time */
  private async restoreExplored() {
    const [width, height] = LOBBY_SIZE.mul(CELL_SIZE);
    // Everything unseen until the saved map is loaded, so nothing shows through
    this.vision.resetExplored(width, height);
    const saved = loadSaveData().lobbyExplored;
    if (!saved) {
      return;
    }
    const image = new Image();
    image.src = saved;
    try {
      await image.decode();
    } catch {
      return; // A bad image just means starting over
    }
    if (!this.isDestroyed) {
      const texture = Texture.from(image);
      this.vision.resetExplored(width, height, texture);
      texture.destroy(true);
    }
  }

  /** Remembers what has been seen of the lobby */
  private async saveExplored() {
    const image = await this.vision.exportExplored();
    if (image) {
      updateSaveData((data) => {
        data.lobbyExplored = image;
      });
    }
  }

  /** Whether the player has to stand still: in the elevator, or behind a screen */
  isInputBlocked(): boolean {
    return (
      !this.arrived ||
      this.leaving ||
      isEncyclopediaOpen(this.game) ||
      isCreditsOpen(this.game)
    );
  }

  private async arriveAfterRun() {
    this.game.addEntity(new FadeEffect(0, 0, RETURN_FADE_IN_TIME));
    await this.wait(RETURN_OPEN_DELAY);
    this.openElevator();
  }

  /** Ding, and out you come */
  async openElevator() {
    this.addChild(new PauseMenu("lobby"));
    await this.arrivalDoor.open();
  }

  openEncyclopedia() {
    if (!isEncyclopediaOpen(this.game)) {
      this.game.addEntity(new Encyclopedia(Persistence.Game));
    }
  }

  @on("tick")
  onTick(dt: number) {
    if (!this.arrived && this.arrivalDoor.openPercentage > DOORS_OPEN_ENOUGH) {
      this.arrived = true;
    }
    this.unlockCheckTime -= dt;
    if (this.unlockCheckTime <= 0) {
      this.unlockCheckTime = UNLOCK_CHECK_INTERVAL;
      this.addNewlyUnlocked();
    }
    if (this.arrived) {
      this.exploredSaveTime -= dt;
      if (this.exploredSaveTime <= 0) {
        this.exploredSaveTime = EXPLORED_SAVE_INTERVAL;
        this.saveExplored();
      }
    }
  }

  /** Up the stairs: fade out, clear the lobby away, and start the run as whoever the player is */
  async startRun() {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    this.game.addEntity(
      new FadeEffect(
        START_RUN_FADE_TIME,
        START_RUN_FADE_TIME,
        START_RUN_FADE_TIME,
      ),
    );
    await this.wait(START_RUN_FADE_TIME);
    await this.saveExplored();
    const game = this.game;
    const character = this.player.character;
    const plan = this.plan;
    game.clearScene(Persistence.Game);
    game.dispatch("newGame", { character, plan });
  }
}

/** The characters rescued so far, in the order they're listed */
function getUnlockedCharacters(): Character[] {
  const unlocked = loadSaveData().unlockedCharacters;
  return CHARACTERS.filter((c) => unlocked.includes(c.name));
}

/** Who the player arrives as: whoever they last played, if they still can */
function getStartingCharacter(): Character {
  const unlocked = getUnlockedCharacters();
  return (
    unlocked.find((c) => c.name === loadSaveData().lastCharacter) ??
    unlocked[0] ??
    CHARACTERS[0]
  );
}

export function getLobby(game: Game): Lobby | undefined {
  return game.entities.getByConstructor(Lobby)[0];
}

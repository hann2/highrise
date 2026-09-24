import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { clamp, lerp, smoothStep } from "../../core/util/MathUtil";
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
import VisionController, {
  EXPLORED_DARKNESS,
} from "../lighting-and-vision/VisionController";
import { isCreditsOpen } from "../menu/CreditsScreen";
import Encyclopedia, { isEncyclopediaOpen } from "../menu/Encyclopedia";
import PauseMenu from "../menu/PauseMenu";
import { loadSaveData, updateSaveData } from "../persistence/SaveData";
import { generateRunPlan, RunPlan } from "../run/RunPlan";
import { Direction } from "../utils/directions";
import LobbyCharacterController from "./LobbyCharacterController";
import ReceptionistBob from "./ReceptionistBob";

/** Offset from the base seed for the lobby and the run plan (levels use 0 up) */
const LOBBY_SEED_OFFSET = 1000;
/**
 * The elevator ride up to the lobby, in seconds: fading in from black, and
 * riding (including the fade) before the car settles and the doors open.
 * Coming back from a run is the same ride, shorter.
 */
const RIDES = {
  fromTitle: { fadeIn: 2.0, ride: 4.0 },
  afterRun: { fadeIn: 1.0, ride: 1.8 },
};
export type LobbyArrival = keyof typeof RIDES;
/** How far the camera shakes while the elevator moves, in meters */
const RIDE_SHAKE = 0.025;
/** How long the shake takes to build up and to die down as the car slows */
const RIDE_SHAKE_RAMP_UP = 0.4;
const RIDE_SHAKE_RAMP_DOWN = 1.0;
/** The bump as the car stops: how big (meters), how long, and how fast it wobbles (Hz) */
const SETTLE_SHAKE = 0.05;
const SETTLE_TIME = 0.5;
const SETTLE_FREQUENCY = 5;
/** From the car stopping to the ding */
const SETTLE_PAUSE = 0.4;
const START_RUN_FADE_TIME = process.env.NODE_ENV === "development" ? 0.1 : 0.8;
/** How far the elevator doors have to be open before the player can move */
const DOORS_OPEN_ENOUGH = 0.4;
/** How often the save is checked for newly rescued characters, so the unlock cheat shows up (seconds) */
const UNLOCK_CHECK_INTERVAL = 0.5;
/** How often what's been seen of the lobby is saved, in case the page is closed (seconds) */
const EXPLORED_SAVE_INTERVAL = 10;

const at = (cell: V2d) => CellGrid.levelCoordToWorldCoord(cell);

/**
 * The hub between runs, and the diegetic main menu. The player rides up in an
 * elevator (after the title when the game boots), walks out into the lobby,
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

  constructor(private arrival: LobbyArrival) {
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
    // Nothing outside the elevator shows until its doors open
    this.vision.exploredDarkness = 1;
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
      action: "Read",
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
        () => !this.arrived || this.leaving,
        "large",
      ),
    );

    this.rideUp();
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

  /** Fades up on the player in the moving elevator; it stops, dings, and out you come */
  private async rideUp() {
    const { fadeIn, ride } = RIDES[this.arrival];
    this.addChild(new PauseMenu("lobby"));
    this.game.addEntity(new FadeEffect(0, 0, fadeIn));
    await this.wait(ride, (_, t) => this.setShake(rideShake(t * ride, ride)));
    await this.wait(SETTLE_TIME, (_, t) =>
      this.setShake(settleShake(t * SETTLE_TIME)),
    );
    this.setShake([0, 0]);
    await this.wait(SETTLE_PAUSE);
    await this.arrivalDoor.open();
  }

  private setShake([x, y]: [number, number]) {
    this.game.camera.shakeOffset.set(x, y);
  }

  @on("destroy")
  onDestroy({ game }: { game: Game }) {
    game.camera.shakeOffset.set(0, 0);
  }

  openEncyclopedia() {
    if (!isEncyclopediaOpen(this.game)) {
      this.game.addEntity(new Encyclopedia(Persistence.Game));
    }
  }

  @on("tick")
  onTick(dt: number) {
    // What's been seen of the lobby comes into view as the doors part
    this.vision.exploredDarkness = lerp(
      1,
      EXPLORED_DARKNESS,
      this.arrivalDoor.openPercentage,
    );
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

/**
 * The elevator moving: a small wobble from a few sines (not `Random`, so it
 * doesn't use up the seed), building up at the start and dying down as the
 * car slows. `time` is into a ride of `duration` seconds.
 */
function rideShake(time: number, duration: number): [number, number] {
  const envelope =
    smoothStep(clamp(time / RIDE_SHAKE_RAMP_UP)) *
    smoothStep(clamp((duration - time) / RIDE_SHAKE_RAMP_DOWN));
  const x = Math.sin(time * 41) + 0.6 * Math.sin(time * 73 + 1.3);
  const y = Math.sin(time * 47 + 2.1) + 0.6 * Math.sin(time * 67 + 0.4);
  const amplitude = (RIDE_SHAKE * envelope) / 1.6;
  return [x * amplitude, y * amplitude];
}

/** The car stopping: one bump that wobbles out, `time` seconds after it */
function settleShake(time: number): [number, number] {
  const decay = 1 - time / SETTLE_TIME;
  const wobble = Math.sin(time * SETTLE_FREQUENCY * 2 * Math.PI);
  return [0, SETTLE_SHAKE * decay * decay * wobble];
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

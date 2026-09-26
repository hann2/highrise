import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { V } from "../../core/Vector";
import { CHARACTERS } from "../characters/Character";
import { Persistence } from "../constants/constants";
import { isEnemy } from "../enemies/base/Enemy";
import Zombie from "../enemies/zombie/Zombie";
import {
  cementFloor,
  woodFloor1,
} from "../environment/decorations/floorDecorations";
import RepeatingFloor from "../environment/RepeatingFloor";
import Wall from "../environment/Wall";
import Human from "../human/Human";
import { AmbientLight } from "../lighting-and-vision/AmbientLight";
import LightingManager from "../lighting-and-vision/LightingManager";
import VisionController from "../lighting-and-vision/VisionController";
import { Molotov } from "../weapons/consumables/consumable-stats/Molotov";
import FireGrid from "./FireGrid";

/** The room, in meters: about what the camera shows */
const WIDTH = 16;
const HEIGHT = 8.5;
/** Seconds between molotovs */
const CYCLE_TIME = 8;
/** Zombies this close to the player are taken away before they attack */
const ZOMBIE_REMOVE_DISTANCE = 1.3;
const PLAYER_POSITION = V(2.5, 4.5);

/**
 * A dev-only scene for looking at fire (`?scene=fire`), instead of the title
 * and the lobby: one room with the camera still on it, a player on the left
 * who can't die, a strip of fuel along the bottom wall that keeps burning, and
 * a short wall sticking out of the top one. Over and over it puts out the
 * fire, has the player throw a molotov to the right, and sends zombies from
 * the right through it. `?ambient=777777` sets the ambient light (the default
 * is dim; the floors go from 000000 to 777777) and `?floor=wood` the floor.
 * `cycles` counts the molotovs, so a recording can wait for one (see
 * `bin/record-clip.ts`).
 */
export default class FireTestScene extends BaseEntity implements Entity {
  id = "fireTestScene";
  persistenceLevel = Persistence.Permanent;
  /** Molotovs thrown so far */
  cycles = 0;
  /** Seconds since the last molotov was thrown */
  cycleTime = 0;
  private player!: Human;
  private grid!: FireGrid;

  @on("add")
  async onAdd() {
    const params = new URLSearchParams(window.location.search);
    const ambient = parseInt(params.get("ambient") ?? "303036", 16);
    const floor = params.get("floor") === "wood" ? woodFloor1 : cementFloor;

    // Humans carry lights, so this has to exist before anyone is added
    this.addChild(new LightingManager());
    this.addChildren(
      new RepeatingFloor(floor, [0, 0], [WIDTH, HEIGHT]),
      new AmbientLight(ambient),
      new Wall([0, 0], [WIDTH, 0]),
      new Wall([0, 0], [0, HEIGHT]),
      new Wall([WIDTH, 0], [WIDTH, HEIGHT]),
      new Wall([0, HEIGHT], [WIDTH, HEIGHT]),
      new Wall([9, 0], [9, 2.5]),
    );
    this.player = this.addChild(new Human(PLAYER_POSITION, CHARACTERS[0]));
    // Enemies ask it whether they can be seen; no fog of war here
    const vision = this.addChild(new VisionController(() => this.player));
    vision.enabled = false;
    this.grid = this.addChild(new FireGrid());
    this.grid.reset(WIDTH, HEIGHT);

    this.game.camera.z = 75;
    this.game.camera.center(V(WIDTH / 2, HEIGHT / 2));

    await this.wait(0.5);
    this.throwMolotov();
  }

  @on("tick")
  onTick(dt: number) {
    this.player.hp = this.player.maxHp;
    for (const enemy of [...this.game.entities.getByFilter(isEnemy)]) {
      if (
        enemy.getPosition().distanceTo(this.player.getPosition()) <
        ZOMBIE_REMOVE_DISTANCE
      ) {
        enemy.destroy();
      }
    }
    if (this.cycles > 0) {
      this.cycleTime += dt;
      if (this.cycleTime >= CYCLE_TIME) {
        this.throwMolotov();
      }
    }
  }

  private async throwMolotov() {
    this.cycles += 1;
    this.cycleTime = 0;
    this.grid.clear();
    for (const enemy of [...this.game.entities.getByFilter(isEnemy)]) {
      enemy.destroy();
    }
    // The fire that doesn't go out
    this.grid.addFuelAlong(V(1, HEIGHT - 0.6), V(7, HEIGHT - 0.6), 1e9);
    this.grid.igniteAt(V(1, HEIGHT - 0.6));

    const player = this.player;
    player.setPosition(PLAYER_POSITION);
    player.body.velocity.set(0, 0);
    player.body.angle = 0;
    player.giveConsumable(Molotov, 1);
    player.useConsumable();

    // Zombies from the right, walking back through the fire
    await this.wait(0.8);
    for (let i = 0; i < 3; i++) {
      const position = V(WIDTH - 1.5 - i * 0.6, 3.3 + i * 1.1);
      this.game.addEntity(new Zombie(position));
    }
  }
}

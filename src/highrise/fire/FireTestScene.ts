import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
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
import PlayerHumanController from "../human/PlayerHumanController";
import { AmbientLight } from "../lighting-and-vision/AmbientLight";
import LightingManager from "../lighting-and-vision/LightingManager";
import VisionController from "../lighting-and-vision/VisionController";
import { Molotov } from "../weapons/consumables/consumable-stats/Molotov";
import Gun from "../weapons/guns/Gun";
import { M1911 } from "../weapons/guns/gun-stats/M1911";
import FireGrid from "./FireGrid";

/** The room, in meters: about what the camera shows */
const WIDTH = 16;
const HEIGHT = 8.5;
/** Seconds between molotovs */
const CYCLE_TIME = 8;
/** Zombies this close to the player are taken away before they attack */
const ZOMBIE_REMOVE_DISTANCE = 1.3;
const PLAYER_POSITION = V(2.5, 4.5);
/** When in a cycle the player shoots through the smoke, and for how long (seconds) */
const SHOOT_START = 5.5;
const SHOOT_DURATION = 1.5;

/**
 * A dev-only scene for looking at fire (`?scene=fire`), instead of the title
 * and the lobby: one room with the camera still on it, a player on the left
 * who can't die, a short wall sticking out of the top one, and a wall on the
 * right with a doorway at the bottom, making a second room. The player can
 * walk around, shoot a pistol and throw molotovs (they never run out), Z sends
 * zombies in from the right, and the cheat keys work. `?strip` adds a strip of
 * fire along the bottom wall that never goes out.
 *
 * `?auto` plays it by itself for recordings (see `bin/record-clip.ts`), with
 * the strip: over and over it puts out the fire, has the player throw a
 * molotov to the right, sends zombies through it (taking them away before they
 * reach the player), and has the player shoot a sweep of shots through the
 * smoke. `cycles` counts the molotovs, so a recording can wait for one.
 * `?ambient=777777` sets the ambient light (the default is dim; the floors go
 * from 000000 to 777777) and `?floor=wood` the floor.
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
  /** Whether it plays by itself (`?auto`) */
  private auto = false;
  /** Whether there's a fire along the bottom wall that never goes out */
  private strip = false;

  @on("add")
  async onAdd() {
    const params = new URLSearchParams(window.location.search);
    const ambient = parseInt(params.get("ambient") ?? "303036", 16);
    const floor = params.get("floor") === "wood" ? woodFloor1 : cementFloor;
    this.auto = params.has("auto");
    this.strip = this.auto || params.has("strip");

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
      // A second room, through a doorway
      new Wall([12, 0], [12, 5.5]),
    );
    this.player = this.addChild(new Human(PLAYER_POSITION, CHARACTERS[0]));
    this.addChild(new PlayerHumanController(() => this.player));
    // For seeing muzzle flashes by firelight; pistols never run out
    this.player.giveWeapon(new Gun(M1911), false);
    // Enemies ask it whether they can be seen; no fog of war here
    const vision = this.addChild(new VisionController(() => this.player));
    vision.enabled = false;
    this.grid = this.addChild(new FireGrid());
    this.grid.reset(WIDTH, HEIGHT);
    const lightMode = params.get("fireLights");
    if (
      lightMode === "cells" ||
      lightMode === "patches" ||
      lightMode === "none"
    ) {
      this.grid.setLightMode(lightMode);
    }

    this.game.camera.z = 75;
    this.game.camera.center(V(WIDTH / 2, HEIGHT / 2));

    this.lightStrip();
    if (this.auto) {
      await this.wait(0.5);
      this.throwMolotov();
    }
  }

  /**
   * C switches how fire is lit (see `FireGrid.lightMode`), and Z sends in
   * zombies
   */
  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "KeyC") {
      this.grid.setLightMode(
        this.grid.lightMode === "cells" ? "patches" : "cells",
      );
    } else if (key === "KeyZ") {
      this.sendZombies();
    }
  }

  @on("tick")
  onTick(dt: number) {
    this.player.hp = this.player.maxHp;
    if (this.player.consumableCount === 0) {
      this.player.giveConsumable(Molotov, 3);
    }
    if (!this.auto) {
      return;
    }
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
      this.shootThroughSmoke();
    }
  }

  /** Partway through a cycle, a sweep of shots through the smoke */
  private shootThroughSmoke() {
    const t = (this.cycleTime - SHOOT_START) / SHOOT_DURATION;
    const gun = this.player.weapon;
    if (t < 0 || t > 1 || !(gun instanceof Gun)) {
      return;
    }
    gun.ammo = gun.stats.ammoCapacity;
    this.player.body.angle = -0.3 + 0.6 * t;
    gun.pullTrigger(this.player);
  }

  private async throwMolotov() {
    this.cycles += 1;
    this.cycleTime = 0;
    this.grid.clear();
    for (const enemy of [...this.game.entities.getByFilter(isEnemy)]) {
      enemy.destroy();
    }
    this.lightStrip();

    // Thrown to the right from wherever the player is; the aim goes back to
    // the mouse next tick
    const player = this.player;
    player.body.angle = 0;
    player.giveConsumable(Molotov, 3);
    player.useConsumable();
    player.giveConsumable(Molotov, 3);

    // Zombies from the right, walking back through the fire
    await this.wait(0.8);
    this.sendZombies();
  }

  /** The fire along the bottom wall that doesn't go out */
  private lightStrip() {
    if (!this.strip) {
      return;
    }
    this.grid.addFuelAlong(V(1, HEIGHT - 0.6), V(7, HEIGHT - 0.6), 1e9);
    this.grid.igniteAt(V(1, HEIGHT - 0.6));
  }

  /** Three zombies from the right, coming for the player */
  private sendZombies() {
    for (let i = 0; i < 3; i++) {
      const position = V(WIDTH - 1.5 - i * 0.6, 6.2 + i * 0.7);
      this.game.addEntity(new Zombie(position));
    }
  }
}

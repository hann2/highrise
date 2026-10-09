import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
import { hexToRgb } from "../../core/util/ColorUtils";
import { rDirection, rUniform, shuffle } from "../../core/util/Random";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import CameraController from "../controllers/CameraController";
import { BaseEnemy, isEnemy } from "../enemies/base/Enemy";
import SimpleEnemyController from "../enemies/base/SimpleEnemyController";
import NecromancerController from "../enemies/necromancer/NecromancerController";
import SpitterController from "../enemies/spitter/SpitterController";
import FireGrid from "../fire/FireGrid";
import { AmmoOverlay } from "../hud/AmmoOverlay";
import { DamagedOverlay } from "../hud/DamagedOverlay";
import { HealthBar } from "../hud/HealthBar";
import Human from "../human/Human";
import PlayerHumanController from "../human/PlayerHumanController";
import { AmbientLight } from "../lighting-and-vision/AmbientLight";
import LightingManager from "../lighting-and-vision/LightingManager";
import ContactShadows from "../lighting-and-vision/ContactShadows";
import VisionController from "../lighting-and-vision/VisionController";
import { ActOverride } from "../run/acts";
import { Molotov } from "../weapons/consumables/consumable-stats/Molotov";
import { bulletSpeed, DEFAULT_BULLET_SLOWDOWN } from "../weapons/guns/GunStats";
import { WEAPONS } from "../weapons/weapons";
import {
  ARENA_ENEMIES,
  ArenaConfig,
  arenaConfigToQuery,
  ArenaEnemyType,
  parseArenaConfig,
} from "./arenaConfig";
import { ARENA_LAYOUTS, ArenaLayout } from "./arenaLayouts";
import { equipLoadout, makeWeapon, refillLoadout } from "./loadout";
import ArenaPanel from "./ArenaPanel";
import ArenaRoom, { ArenaDoors, ArenaLights } from "./ArenaRoom";

/** Ambient light when it's bright (like the lobby) and when it's as dark as a floor */
const BRIGHT_AMBIENT = 0x777777;
const DARK_AMBIENT = 0x060606;
/** Seconds between enemies when they trickle in */
const TRICKLE_INTERVAL = 0.6;
/** Enemies surrounding the player don't start closer than this (meters) */
const SURROUND_MIN_DISTANCE = 7;
/** Enemies spread over the room keep this far (meters) from the walls */
const SPREAD_WALL_CLEARANCE = 0.8;
/** Seconds from the player dying to them being back */
const RESPAWN_DELAY = 1.5;
/** Seconds between weapon changes, so a trackpad's scroll doesn't fly through them all */
const CYCLE_COOLDOWN = 0.15;
/** A rectangle of the room, in meters */
interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Seconds of fuel in the fires that never go out */
const ENDLESS_FUEL = 1e9;

/** How the current wave is going, for the readout */
export interface WaveStatus {
  size: number;
  /** Still to come in, when they trickle */
  toCome: number;
  alive: number;
  /** Seconds since it was sent, stopped once it's cleared */
  time: number;
  cleared: boolean;
  /** Damage the player took during it */
  damageTaken: number;
}

/**
 * A dev-only scene for trying characters and loadouts against enemies
 * (`?scene=arena`), instead of the title and the lobby. The whole setup is in
 * the URL (see `parseArenaConfig`) and is changed with the panel (Tab), which
 * keeps the URL up to date, so reloading keeps it.
 *
 * Enter sends a wave, Backspace clears the enemies away (and the fire and
 * whatever's on the floor), and Shift-Backspace does that and resets the
 * player too. Q (Shift-Q, the wheel, Y) doesn't swap slots here: it goes
 * through every weapon in the game, as if the player carried them all. The
 * player comes back after dying. Enemies are as tough as in the chosen act.
 */
export default class ArenaScene
  extends BaseEntity
  implements Entity, ActOverride
{
  id = "arenaScene";
  tags = ["act_override"];
  persistenceLevel = Persistence.Permanent;
  config: ArenaConfig;
  player?: Human;
  wave?: WaveStatus;
  /**
   * Where the config's fires go: the whole room, unless set (the fire
   * benchmark sets it to the offices' size around the player, to compare
   * layouts with the same fires in view)
   */
  fireArea?: Area;
  private layout!: ArenaLayout;
  private room?: ArenaRoom;
  /** Only when it's dark */
  private lights?: ArenaLights;
  /** Only with the `doors` option */
  private doors?: ArenaDoors;
  private ambient!: AmbientLight;
  private vision!: VisionController;
  private grid!: FireGrid;
  /** Goes up with every wave, so a trickle stops when a new one is sent */
  private waveNumber = 0;

  constructor() {
    super();
    this.config = parseArenaConfig(new URLSearchParams(window.location.search));
  }

  /** For `getCurrentAct`: enemies are as tough as in this act */
  get act(): number {
    return this.config.act;
  }

  @on("destroy")
  onDestroy() {
    bulletSpeed.slowdown = DEFAULT_BULLET_SLOWDOWN;
  }

  @on("add")
  onAdd() {
    const getPlayer = () => this.player;
    // Humans carry lights, so this has to exist before anyone is added
    this.addChild(new LightingManager());
    this.addChild(new ContactShadows());
    this.ambient = this.addChild(new AmbientLight(BRIGHT_AMBIENT));
    this.grid = this.addChild(new FireGrid());
    // Enemies ask it whether they can be seen, even with the fog off
    this.vision = this.addChild(new VisionController(getPlayer));
    this.apply(this.config, true);
    // After the player exists: the HUD expects there to be one
    const panel = this.addChild(new ArenaPanel(this));
    this.addChildren(
      new CameraController(this.game.camera, getPlayer),
      new PlayerHumanController(
        () => this.player!,
        () => this.player!.isDestroyed || panel.open,
        (direction) => this.cycleWeapon(direction),
      ),
      new DamagedOverlay(getPlayer),
      new AmmoOverlay(() => this.player!),
      new HealthBar(() => this.player!),
    );
  }

  /**
   * Switches to `config`: rebuilds the room if the layout changed, clears the
   * enemies away if the room or the act changed, and always resets the
   * player with the loadout. Keeps the URL up to date.
   */
  apply(config: ArenaConfig, first: boolean = false) {
    const previous = this.config;
    this.config = config;
    window.history.replaceState(null, "", arenaConfigToQuery(config));

    const newRoom = first || config.layout !== previous.layout;
    if (newRoom) {
      this.layout = ARENA_LAYOUTS[config.layout];
      this.room?.destroy();
      this.room = this.addChild(new ArenaRoom(this.layout));
      this.grid.reset(this.layout.width, this.layout.height);
      this.vision.resetExplored(this.layout.width, this.layout.height);
    }
    if (newRoom || config.act !== previous.act) {
      this.clear();
    } else {
      if (config.fires !== previous.fires) {
        this.grid.clear();
        this.lightFires();
      }
      if (config.doors !== previous.doors) {
        this.placeDoors();
      }
    }

    this.ambient.color = hexToRgb(config.dark ? DARK_AMBIENT : BRIGHT_AMBIENT);
    if (newRoom || config.dark !== previous.dark) {
      this.lights?.destroy();
      this.lights = config.dark
        ? this.addChild(new ArenaLights(this.layout))
        : undefined;
    }
    this.vision.enabled = config.fog;
    bulletSpeed.slowdown = config.bulletSlowdown;
    if (config.dummies) {
      for (const enemy of this.game.entities.getByFilter(isEnemy)) {
        makeDummy(enemy);
      }
    }

    // Where they were, unless the room changed under them
    const position =
      !newRoom && this.player && !this.player.isDestroyed
        ? this.player.getPosition()
        : this.layout.playerStart;
    this.spawnPlayer(position);
  }

  /** A fresh player at `position`, carrying the loadout */
  private spawnPlayer(position: V2d) {
    const angle = this.player?.getDirection() ?? 0;
    if (this.player && !this.player.isDestroyed) {
      this.player.destroy();
    }
    const config = this.config;
    const player = this.addChild(new Human(position.clone(), config.character));
    player.body.angle = angle;
    equipLoadout(player, config);
    this.player = player;
  }

  /** When the weapon in hand last changed, in game seconds */
  private lastCycleTime = -Infinity;

  /**
   * Swaps the weapon in hand for the next one in `WEAPONS` (`direction` -1:
   * the one before), or the first (last) if it has none, and keeps the config
   * and the URL up to date so a reset or a reload keeps it
   */
  cycleWeapon(direction: 1 | -1) {
    const player = this.player;
    if (
      !player ||
      player.isDestroyed ||
      this.game.elapsedTime - this.lastCycleTime < CYCLE_COOLDOWN
    ) {
      return;
    }
    this.lastCycleTime = this.game.elapsedTime;
    const slot = player.activeSlot;
    const current = player.getWeaponInSlot(slot)?.stats;
    const index = current ? WEAPONS.indexOf(current) : -1;
    const next =
      index === -1
        ? WEAPONS[direction > 0 ? 0 : WEAPONS.length - 1]
        : WEAPONS[(index + direction + WEAPONS.length) % WEAPONS.length];
    player.removeWeapon(slot);
    // The slot in hand is the empty one now, so that's where it goes
    const weapon = makeWeapon(next);
    player.giveWeapon(weapon, false);
    weapon.playSound("pickup", player.getPosition());

    const weapons: ArenaConfig["weapons"] = [...this.config.weapons];
    weapons[slot] = next;
    this.config = { ...this.config, weapons };
    window.history.replaceState(null, "", arenaConfigToQuery(this.config));
  }

  /** Every enemy gone, with the fire, the smoke and whatever's lying on the floor */
  clear() {
    this.waveNumber += 1;
    this.wave = undefined;
    // Everything the scene didn't make itself (it all lives under the scene)
    this.game.clearScene(Persistence.Floor);
    this.grid.clear();
    this.lightFires();
    this.placeDoors();
  }

  /** New doors in the doorways, all shut, if the config has them */
  private placeDoors() {
    this.doors?.destroy();
    this.doors = this.config.doors
      ? this.addChild(new ArenaDoors(this.layout))
      : undefined;
  }

  /**
   * The config's fires that never go out: a molotov's worth of fuel each,
   * spread over the room clear of the player, all lit
   */
  private lightFires() {
    if (this.config.fires === 0) {
      return;
    }
    const { radius } = Molotov.fire!;
    for (const spot of this.spreadSpots(this.config.fires, this.fireArea)) {
      const cells = this.grid.spillFuel(spot, radius, ENDLESS_FUEL);
      this.grid.igniteCells(cells);
    }
  }

  /** Sends in the wave the config describes, the way it says */
  async sendWave() {
    const waveNumber = ++this.waveNumber;
    const types = shuffle(
      ARENA_ENEMIES.flatMap((type) =>
        Array<ArenaEnemyType>(this.config.wave[type.name] ?? 0).fill(type),
      ),
    );
    const wave: WaveStatus = {
      size: types.length,
      toCome: types.length,
      alive: 0,
      time: 0,
      cleared: false,
      damageTaken: 0,
    };
    this.wave = wave;

    const spots =
      this.config.arrival === "spread"
        ? this.spreadSpots(types.length)
        : this.surroundSpots();
    for (const [i, type] of types.entries()) {
      if (this.config.arrival === "trickle" && i > 0) {
        await this.wait(TRICKLE_INTERVAL);
        if (this.waveNumber !== waveNumber) {
          return;
        }
      }
      const position =
        this.config.arrival === "surround"
          ? spots[i % spots.length].add(polarToVec(rDirection(), 0.3))
          : this.config.arrival === "spread"
            ? spots[i % spots.length]
            : this.spawnAreaSpot();
      this.spawnEnemy(type, position);
      wave.toCome -= 1;
    }
  }

  private spawnEnemy(type: ArenaEnemyType, position: V2d) {
    const room = V(this.layout.width, this.layout.height);
    const enemy = this.game.addEntity(type.make(position, room));
    // Facing the player
    const player = this.player;
    if (player && !player.isDestroyed) {
      enemy.body.angle = player.getPosition().sub(position).angle;
    }
    if (this.config.dummies) {
      makeDummy(enemy);
    }
  }

  /** Somewhere random in the far end */
  private spawnAreaSpot(): V2d {
    const { center, radius } = this.layout.spawnArea;
    return center.add(
      polarToVec(rDirection(), radius * Math.sqrt(rUniform(0, 1))),
    );
  }

  /** Spots around the edge far enough from the player, in a random order */
  private surroundSpots(): V2d[] {
    const at = this.player?.getPosition() ?? this.layout.playerStart;
    const far = this.layout.edgeSpots.filter(
      (spot) => spot.distanceTo(at) >= SURROUND_MIN_DISTANCE,
    );
    return shuffle(far.length > 0 ? far : [...this.layout.edgeSpots]);
  }

  /**
   * `count` spots spread evenly over the room (or `area` of it), clear of the
   * walls and not too close to the player, in a random order. A grid, made
   * finer until enough spots fit, with a little jitter so it doesn't look
   * like one.
   */
  private spreadSpots(count: number, area?: Area): V2d[] {
    const { walls } = this.layout;
    const left = Math.max(0, area?.x ?? 0);
    const top = Math.max(0, area?.y ?? 0);
    const right = Math.min(this.layout.width, left + (area?.width ?? Infinity));
    const bottom = Math.min(
      this.layout.height,
      top + (area?.height ?? Infinity),
    );
    const at = this.player?.getPosition() ?? this.layout.playerStart;
    const inset = SPREAD_WALL_CLEARANCE;
    const clear = (spot: V2d) =>
      spot.distanceTo(at) >= SURROUND_MIN_DISTANCE &&
      walls.every(
        ([from, to]) =>
          distanceToSegment(spot, V(from), V(to)) >= SPREAD_WALL_CLEARANCE,
      );

    let spacing = Math.sqrt(
      ((right - left - 2 * inset) * (bottom - top - 2 * inset)) / count,
    );
    for (let attempt = 0; attempt < 20; attempt++, spacing *= 0.9) {
      const spots: V2d[] = [];
      for (
        let x = left + inset + spacing / 2;
        x < right - inset;
        x += spacing
      ) {
        for (
          let y = top + inset + spacing / 2;
          y < bottom - inset;
          y += spacing
        ) {
          const spot = V(x, y);
          if (clear(spot)) {
            spots.push(spot);
          }
        }
      }
      if (spots.length >= count) {
        const jitter = spacing * 0.25;
        return shuffle(spots).map((spot) =>
          spot.iadd(V(rUniform(-jitter, jitter), rUniform(-jitter, jitter))),
        );
      }
    }
    // More than fit: they'll push each other apart
    return this.surroundSpots();
  }

  @on("tick")
  onTick(dt: number) {
    const player = this.player;
    if (player && !player.isDestroyed) {
      if (this.config.god) {
        player.hp = player.maxHp;
      }
      if (this.config.infiniteAmmo) {
        refillLoadout(player, this.config);
      }
    }

    const wave = this.wave;
    if (wave && !wave.cleared) {
      wave.time += dt;
      wave.alive = this.game.entities.getByFilter(isEnemy).length;
      wave.cleared = wave.toCome === 0 && wave.alive === 0;
    }
  }

  @on("humanInjured")
  onHumanInjured({ human, amount }: { human: Human; amount: number }) {
    if (human === this.player && this.wave && !this.wave.cleared) {
      this.wave.damageTaken += amount;
    }
  }

  @on("humanDied")
  async onHumanDied({ human }: { human: Human }) {
    if (human !== this.player) {
      return;
    }
    await this.wait(RESPAWN_DELAY);
    if (this.player === human) {
      this.spawnPlayer(this.layout.playerStart);
    }
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    const shift =
      this.game.io.isKeyDown("ShiftLeft") ||
      this.game.io.isKeyDown("ShiftRight");
    if (key === "Enter") {
      this.sendWave();
    } else if (key === "Backspace") {
      this.clear();
      if (shift) {
        this.spawnPlayer(this.layout.playerStart);
      }
    }
  }
}

/** How far `point` is from the segment `from`-`to` */
function distanceToSegment(point: V2d, from: V2d, to: V2d): number {
  const along = to.sub(from);
  const lengthSquared = along.dot(along);
  const t =
    lengthSquared > 0
      ? Math.min(1, Math.max(0, point.sub(from).dot(along) / lengthSquared))
      : 0;
  return point.distanceTo(from.add(along.imul(t)));
}

/** Takes away what makes an enemy move and attack, so it stands there */
export function makeDummy(enemy: BaseEnemy) {
  for (const child of [...enemy.children]) {
    if (
      child instanceof SimpleEnemyController ||
      child instanceof SpitterController ||
      child instanceof NecromancerController
    ) {
      child.destroy();
    }
  }
}

import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
import { V, V2d } from "../../core/Vector";
import { slug } from "../arena/arenaConfig";
import { CHARACTERS } from "../characters/Character";
import { Persistence } from "../constants/constants";
import { BaseEnemy } from "../enemies/base/Enemy";
import SimpleEnemyController from "../enemies/base/SimpleEnemyController";
import Heavy from "../enemies/heavy/Heavy";
import Sprinter from "../enemies/sprinter/Sprinter";
import Zombie from "../enemies/zombie/Zombie";
import { cementFloor } from "../environment/decorations/floorDecorations";
import FloorText from "../environment/FloorText";
import RepeatingFloor from "../environment/RepeatingFloor";
import Wall from "../environment/Wall";
import Human from "../human/Human";
import { AmbientLight } from "../lighting-and-vision/AmbientLight";
import ContactShadows from "../lighting-and-vision/ContactShadows";
import LightingManager from "../lighting-and-vision/LightingManager";
import VisionController from "../lighting-and-vision/VisionController";
import { GUNS } from "../weapons/guns/gun-stats/gunStats";
import Gun from "../weapons/guns/Gun";
import { BodySprite } from "../creature-stuff/BodySprite";
import { HIP_WIDTH } from "../creature-stuff/Legs";
import { Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import { GameSprite } from "../../core/entity/GameSprite";
import { darken } from "../../core/util/ColorUtils";
import { WET_RADIUS } from "../effects/BloodSplat";
import { BLOOD_COLOR, getFloorStains } from "../effects/FloorStains";
import { SPLAT_TEXTURES } from "../effects/Splat";
import FootprintMarker from "./FootprintMarker";
import { RIG_SPEEDS } from "./RigTestScene";

/** Meters from one lane to the next, and from the walls to the ends of the lanes */
const LANE_SPACING = 1.5;
const MARGIN = 1.5;
const LENGTH = 11;
/** Seconds each walker stands at the end of its lane before walking back */
const PAUSE = 0.6;
/** Hurt walkers are kept at this share of their health (under 30% is hurt) */
const HURT = 0.2;
/** With `blood`: how far along each lane its puddle is, and how big (meters) */
const PUDDLE_ALONG = 0.3;
const PUDDLE_SIZE = 2.2;
/** Turning on the spot: seconds between turns, and the ways it turns to */
const TURN_INTERVAL = 1.2;
const TURN_FACINGS = [0, 2.4, 0.8, -1.6];
/** Zigzagging: radians either side of straight on, and how fast it weaves */
const ZIGZAG = 0.45;
const ZIGZAG_RATE = 5;

/** Who walks a lane and how */
interface Lane {
  label: string;
  /** A human (`character`, `gun` by slug, or empty-handed), or an enemy */
  walker:
    | { character: string; gun?: string }
    | { enemy: "zombie" | "sprinter" | "heavy" };
  /** Which way they face, from the way they're going: 0 forward, π backward */
  facing: number;
  /** A share of their full speed */
  speed?: number;
  sprint?: boolean;
  hurt?: boolean;
  /** Weaves from side to side, turning as it walks */
  zigzag?: boolean;
  /** Stays where it is, turning on the spot */
  turn?: boolean;
}

const LANES: Record<string, Lane> = {
  forward: { label: "walking", walker: { character: "andy" }, facing: 0 },
  rifle: {
    label: "with a rifle",
    walker: { character: "simon", gun: "ar15" },
    facing: 0,
  },
  backward: {
    label: "backward",
    walker: { character: "nancy", gun: "m1911" },
    facing: Math.PI,
  },
  sideways: {
    label: "sideways",
    walker: { character: "wendy", gun: "m1911" },
    facing: Math.PI / 2,
  },
  diagonal: {
    label: "diagonally",
    walker: { character: "dusty-rusty", gun: "remingtonshotgun" },
    facing: Math.PI / 4,
  },
  slow: {
    label: "slowly",
    walker: { character: "clarice" },
    facing: 0,
    speed: 0.35,
  },
  sprint: {
    label: "sprinting",
    walker: { character: "kyle", gun: "ar15" },
    facing: 0,
    sprint: true,
  },
  hurt: {
    label: "hurt",
    walker: { character: "santa", gun: "m1911" },
    facing: 0,
    hurt: true,
  },
  zombie: { label: "zombie", walker: { enemy: "zombie" }, facing: 0 },
  shamble: {
    label: "zombie shambling",
    walker: { enemy: "zombie" },
    facing: 0,
    speed: 0.2,
  },
  sprinter: { label: "sprinter", walker: { enemy: "sprinter" }, facing: 0 },
  heavy: { label: "heavy", walker: { enemy: "heavy" }, facing: 0 },
  zigzag: {
    label: "zigzagging",
    walker: { character: "takeshi", gun: "glock" },
    facing: 0,
    zigzag: true,
  },
  turn: {
    label: "turning on the spot",
    walker: { character: "chad" },
    facing: 0,
    turn: true,
  },
};

interface Walker {
  lane: Lane;
  human?: Human;
  enemy?: BaseEnemy;
  /** Where the lane starts and ends */
  from: V2d;
  to: V2d;
  /** Heading to `to` (else back to `from`) */
  out: boolean;
  /** Seconds left standing at the end of the lane */
  waiting: number;
}

/** A puddle of blood that stays, like a corpse's */
class Puddle extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    private where: V2d,
    size: number,
  ) {
    super();
    this.sprite = Sprite.from(SPLAT_TEXTURES[2]);
    this.sprite.anchor.set(0.5);
    this.sprite.width = size;
    this.sprite.height = size;
    this.sprite.position.copyFrom(where);
    this.sprite.tint = darken(0xff0000, 0.45);
    this.sprite.alpha = 0.9;
    this.sprite.layerName = Layer.FLOOR_DECALS;
  }

  @on("add")
  onAdd() {
    getFloorStains(this.game).spill(
      this.where,
      this.sprite.width * WET_RADIUS,
      BLOOD_COLOR,
    );
  }
}

/**
 * A dev-only scene for looking at how bodies walk (`?scene=walk`): a lane
 * each for walking forward, backward, sideways, diagonally, slowly,
 * sprinting, hurt, and zombies, a sprinter and a heavy, back and forth;
 * one zigzagging, and one turning on the spot.
 * `lanes=forward,backward` picks lanes (from `LANES`), `zoom` the pixels per
 * meter (else they fill the view), `follow` keeps the camera on the first
 * walker (for close ups), `prints` marks where each foot lands
 * (`FootprintMarker`), `blood` puts a puddle of blood across every lane for
 * them to walk through and leave bloody footprints, `speed` how fast it plays. `?auto` is for recording
 * (`npm run clip -- --scene walk`); `cycles` counts the trips the first
 * lane's walker has started.
 *
 * Keys: 1-4 the speed, Space pause, P footprints, Enter start over.
 */
export default class WalkTestScene extends BaseEntity implements Entity {
  id = "walkTestScene";
  persistenceLevel = Persistence.Permanent;
  /** Trips the first walker has started */
  cycles = 0;
  private walkers: Walker[] = [];
  private speed = 1;
  private paused = false;
  /** Whether the camera follows the first walker (`follow`) */
  private follow = false;
  /** Whether each foot's landing is marked on the floor (`prints`, P) */
  private prints = false;

  @on("add")
  onAdd() {
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get("lanes")?.split(",") ?? [];
    const lanes = (wanted.length > 0 ? wanted : Object.keys(LANES))
      .map((name) => LANES[name])
      .filter((lane) => lane !== undefined);

    const width = LENGTH + MARGIN * 2;
    const height = lanes.length * LANE_SPACING + MARGIN;
    const view = this.game.renderer.getSize();
    const zoom =
      Number(params.get("zoom")) ||
      Math.min(view[0] / width, view[1] / height) * 0.98;
    const roomWidth = Math.max(width, view[0] / zoom);
    const roomHeight = Math.max(height, view[1] / zoom);
    const offset = V(roomWidth - width, roomHeight - height).imul(0.5);

    // Humans carry lights, so this has to exist before anyone is added
    this.addChild(new LightingManager());
    this.addChild(new ContactShadows());
    this.addChildren(
      new RepeatingFloor(cementFloor, [0, 0], [roomWidth, roomHeight]),
      new AmbientLight(0xdddddd),
      new Wall([0, 0], [roomWidth, 0]),
      new Wall([0, 0], [0, roomHeight]),
      new Wall([roomWidth, 0], [roomWidth, roomHeight]),
      new Wall([0, roomHeight], [roomWidth, roomHeight]),
    );

    this.walkers = lanes.map((lane, i) => {
      const y = MARGIN / 2 + LANE_SPACING * (i + 0.5);
      const from = V(MARGIN, y).iadd(offset);
      const to = V(MARGIN + LENGTH, y).iadd(offset);
      this.addChild(
        new FloorText(from.add(V(0, -0.6)), lane.label, {
          heightMeters: 0.18,
          color: "#303030",
        }),
      );
      return {
        lane,
        ...this.makeWalker(lane, from.clone()),
        from,
        to,
        out: true,
        waiting: PAUSE,
      };
    });

    if (params.has("blood")) {
      // A puddle across every lane, a third of the way along
      for (const walker of this.walkers) {
        const where = walker.from.lerp(walker.to, PUDDLE_ALONG);
        this.addChild(new Puddle(where, PUDDLE_SIZE));
      }
    }

    // Enemies ask it whether they can be seen; no fog of war here
    const firstHuman = this.walkers.find((w) => w.human)?.human;
    const vision = this.addChild(new VisionController(() => firstHuman));
    vision.enabled = false;

    this.game.camera.z = zoom;
    this.game.camera.center(V(roomWidth / 2, roomHeight / 2));
    this.follow = params.has("follow");
    this.prints = params.has("prints");
    this.speed = Number(params.get("speed") ?? 1) || 1;
    this.game.slowMo = this.speed;

    for (const walker of this.walkers) {
      const sprite = walker.human
        ? walker.human.humanSprite
        : walker.enemy?.children.find((c) => c instanceof BodySprite);
      if (sprite instanceof BodySprite && sprite.gait) {
        const scale = sprite.gait.hipWidth / HIP_WIDTH;
        sprite.onFootLand = (landing) => {
          if (this.prints) {
            this.addChild(new FootprintMarker(landing, scale));
          }
        };
      }
    }
  }

  @on("render")
  onRender() {
    // Up close, the camera goes along with the first walker, between the lanes
    const first = this.walkers[0];
    const last = this.walkers[this.walkers.length - 1];
    const creature = first?.human ?? first?.enemy;
    if (this.follow && creature) {
      this.game.camera.center(
        V(creature.body.position[0], (first.from[1] + last.from[1]) / 2),
      );
    }
  }

  private makeWalker(
    lane: Lane,
    position: V2d,
  ): Pick<Walker, "human" | "enemy"> {
    const { walker } = lane;
    if ("enemy" in walker) {
      const enemy =
        walker.enemy === "zombie"
          ? new Zombie(position)
          : walker.enemy === "sprinter"
            ? new Sprinter(position)
            : new Heavy(position);
      this.game.addEntity(enemy);
      return { enemy };
    }
    const character =
      CHARACTERS.find((c) => slug(c.name) === slug(walker.character)) ??
      CHARACTERS[0];
    const human = this.addChild(new Human(position.clone(), character));
    human.body.angle = 0;
    const gun = GUNS.find(
      (stats) => slug(stats.name) === slug(walker.gun ?? ""),
    );
    if (gun) {
      human.giveWeapon(new Gun(gun), false);
    }
    if (lane.sprint) {
      human.setSprinting(true);
    }
    return { human };
  }

  restart() {
    this.cycles = 0;
    for (const walker of this.walkers) {
      const body = (walker.human ?? walker.enemy)!.body;
      body.position.set(walker.from);
      body.velocity.set(0, 0);
      walker.out = true;
      walker.waiting = PAUSE;
    }
  }

  @on("tick")
  onTick(dt: number) {
    // Enemies walk where they're told
    for (const controller of [
      ...this.game.entities.getByConstructor(SimpleEnemyController),
    ]) {
      controller.destroy();
    }

    this.walkers.forEach((walker, i) => {
      const { lane, human, enemy } = walker;
      const creature = (human ?? enemy)!;
      const position = creature.body.position;
      const target = walker.out ? walker.to : walker.from;
      const time = this.game.simulatedTime;
      const heading = walker.out ? 0 : Math.PI;
      // Turning on the spot: a new way every so often
      const turns = Math.floor(time / TURN_INTERVAL);
      const facing = lane.turn
        ? TURN_FACINGS[turns % TURN_FACINGS.length]
        : heading + lane.facing;

      if (human) {
        human.hp = human.maxHp * (lane.hurt ? HURT : 1);
        human.setDirection(facing, dt);
      } else if (enemy) {
        enemy.hp = 1000;
        enemy.setTargetDirection(facing);
      }

      if (lane.turn) {
        creature.walkSpring.stop();
        if (i === 0 && turns > this.cycles) {
          this.cycles = turns;
        }
        return;
      }
      if (walker.waiting > 0) {
        creature.walkSpring.stop();
        walker.waiting -= dt;
        if (walker.waiting <= 0 && i === 0 && walker.out) {
          this.cycles++;
        }
        return;
      }
      const toGo = target[0] - position[0];
      if (Math.sign(toGo) !== (walker.out ? 1 : -1)) {
        walker.out = !walker.out;
        walker.waiting = PAUSE;
        creature.walkSpring.stop();
        return;
      }
      // Keep to the lane
      const drift = target[1] - position[1];
      const weave = lane.zigzag ? Math.sin(time * ZIGZAG_RATE) * ZIGZAG : 0;
      creature.walkSpring.walkTowards(
        Math.atan2(drift * 2, toGo) + weave,
        lane.speed ?? 1,
      );
    });
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    const speedIndex = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(key);
    if (speedIndex >= 0) {
      this.speed = RIG_SPEEDS[speedIndex];
      this.paused = false;
      this.game.slowMo = this.speed;
    } else if (key === "Space") {
      this.paused = !this.paused;
      this.game.slowMo = this.paused ? 0 : this.speed;
    } else if (key === "KeyP") {
      this.prints = !this.prints;
    } else if (key === "Enter") {
      this.restart();
    }
  }
}

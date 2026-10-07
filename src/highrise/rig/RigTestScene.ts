import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
import { clamp } from "../../core/util/MathUtil";
import { V } from "../../core/Vector";
import { slug } from "../arena/arenaConfig";
import { CHARACTERS } from "../characters/Character";
import { Persistence } from "../constants/constants";
import { cementFloor } from "../environment/decorations/floorDecorations";
import FloorText from "../environment/FloorText";
import RepeatingFloor from "../environment/RepeatingFloor";
import Wall from "../environment/Wall";
import Human from "../human/Human";
import { AmbientLight } from "../lighting-and-vision/AmbientLight";
import ContactShadows from "../lighting-and-vision/ContactShadows";
import LightingManager from "../lighting-and-vision/LightingManager";
import { GUNS } from "../weapons/guns/gun-stats/gunStats";
import Gun from "../weapons/guns/Gun";
import {
  GunAnimations,
  GunStats,
  ReloadingStyle,
} from "../weapons/guns/GunStats";
import RigOverlay from "./RigOverlay";
import RigPanel from "./RigPanel";

/** Meters between the humans in the lineup */
const COLUMN_SPACING = 2.8;
const ROW_SPACING = 1.9;
const MAX_COLUMNS = 4;
/** Room around the lineup, in meters */
const MARGIN = 1.2;
/** Seconds from one demonstration to the next */
const CYCLE_TIME = 5;
/** Seconds between one animation playing and the next, in `anim` mode */
const ANIMATION_GAP = 0.6;
/** Rounds loaded one at a time in each demonstration */
const INDIVIDUAL_ROUNDS = 3;
/** Seconds of the animation's own time each arrow key press scrubs */
const SCRUB_STEP = 1 / 60;

/** Speeds the number keys pick: 1 is full speed */
export const RIG_SPEEDS = [1, 0.5, 0.25, 0.1];

/** What the scene shows: shooting and reloading, or one of the guns' animations over and over */
export type RigMode = "demo" | keyof GunAnimations;
export const RIG_MODES: RigMode[] = [
  "demo",
  "reload",
  "reloadEmpty",
  "reloadStart",
  "reloadInsert",
  "reloadFinish",
  "pump",
];

/**
 * A dev-only scene for looking at how humans are posed and animated
 * (`?scene=rig`): humans standing in a lineup, one per gun, each shooting a
 * little and reloading, over and over (or with `anim=reload`, playing one of
 * the guns' animations over and over: any of `RIG_MODES`). `gun=ar15,glock`
 * picks the guns (by `slug`; all of them by default), `character=nancy` who
 * holds them, `columns` how many to a row (4), `zoom` the pixels per meter
 * (else the lineup fills the view), `speed` how fast it plays (`speed=0.25`
 * is quarter speed), and `points` marks the points on the guns and where the
 * hands are (`RigOverlay`). `?auto` hides the panel, for recording
 * (`npm run clip -- --scene rig`); `cycles` counts the demonstrations.
 *
 * Keys: 1-4 the speed, Space pause, . one frame, ← → scrub the animations
 * while paused, M the mode, G the points, Enter start over.
 */
export default class RigTestScene extends BaseEntity implements Entity {
  id = "rigTestScene";
  persistenceLevel = Persistence.Permanent;
  /** Demonstrations so far */
  cycles = 0;
  humans: Human[] = [];
  guns: GunStats[];
  mode: RigMode;
  speed: number;
  paused = false;
  /** One frame to run while paused */
  private stepping = false;
  private overlay?: RigOverlay;

  constructor() {
    super();
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get("gun")?.split(",").map(slug) ?? [];
    this.guns =
      wanted.length > 0
        ? wanted
            .map((name) => GUNS.find((gun) => slug(gun.name) === name))
            .filter((gun): gun is GunStats => gun !== undefined)
        : GUNS;
    this.speed = Number(params.get("speed") ?? 1) || 1;
    const anim = params.get("anim");
    this.mode = RIG_MODES.find((mode) => mode === anim) ?? "demo";
  }

  @on("add")
  async onAdd() {
    const params = new URLSearchParams(window.location.search);
    const character =
      CHARACTERS.find(
        (c) => slug(c.name) === slug(params.get("character") ?? ""),
      ) ?? CHARACTERS[0];

    const columns = Math.min(
      this.guns.length,
      Number(params.get("columns")) || MAX_COLUMNS,
    );
    const rows = Math.ceil(this.guns.length / columns);
    const lineupWidth = columns * COLUMN_SPACING + MARGIN;
    const lineupHeight = rows * ROW_SPACING + MARGIN;
    // The room fills the view, with the lineup in the middle
    const view = this.game.renderer.getSize();
    const zoom =
      Number(params.get("zoom")) ||
      Math.min(view[0] / lineupWidth, view[1] / lineupHeight) * 0.98;
    const width = Math.max(lineupWidth, view[0] / zoom);
    const height = Math.max(lineupHeight, view[1] / zoom);
    const offset = V(width - lineupWidth, height - lineupHeight).imul(0.5);

    // Humans carry lights, so this has to exist before anyone is added
    this.addChild(new LightingManager());
    this.addChild(new ContactShadows());
    this.addChildren(
      new RepeatingFloor(cementFloor, [0, 0], [width, height]),
      new AmbientLight(0xdddddd),
      new Wall([0, 0], [width, 0]),
      new Wall([0, 0], [0, height]),
      new Wall([width, 0], [width, height]),
      new Wall([0, height], [width, height]),
    );

    this.humans = this.guns.map((stats, i) => {
      const column = i % columns;
      const row = Math.floor(i / columns);
      const position = V(
        MARGIN / 2 + 0.6 + column * COLUMN_SPACING,
        MARGIN / 2 + ROW_SPACING / 2 + row * ROW_SPACING,
      ).iadd(offset);
      const human = this.addChild(new Human(position, character));
      human.body.angle = 0;
      human.giveWeapon(new Gun(stats), false);
      this.addChild(
        new FloorText(position.add(V(0.9, 0.62)), stats.name, {
          heightMeters: 0.18,
          color: "#303030",
        }),
      );
      return human;
    });

    this.game.camera.z = zoom;
    // `follow`: on the first one's gun, for close ups
    this.game.camera.center(
      params.has("follow") && this.humans.length > 0
        ? this.humans[0].getPosition().add(V(0.5, 0))
        : V(width / 2, height / 2),
    );

    if (params.has("points")) {
      this.togglePoints();
    }
    if (!params.has("auto")) {
      this.addChild(new RigPanel(this));
    }

    this.game.slowMo = this.speed;
    await this.wait(0.5);
    this.loop();
  }

  private async loop() {
    while (true) {
      const cycle = ++this.cycles;
      // Last time's shells and magazines
      this.game.clearScene(Persistence.Floor);
      // The longest animation played, in `anim` mode
      let longest = 0;
      for (const human of this.humans) {
        if (this.mode === "demo") {
          this.demonstrate(human);
        } else {
          const gun = human.weapon as Gun;
          gun.cancelReload();
          if (gun.animate(this.mode, human)) {
            longest = Math.max(
              longest,
              gun.animationDuration(this.mode, human),
            );
          }
        }
      }
      await this.wait(longest > 0 ? longest + ANIMATION_GAP : CYCLE_TIME);
      // Started over meanwhile
      if (this.cycles !== cycle) {
        return;
      }
    }
  }

  /** Shoots a little, then reloads */
  private async demonstrate(human: Human) {
    const gun = human.weapon;
    if (!(gun instanceof Gun)) {
      return;
    }
    gun.cancelReload();
    human.reserve[gun.stats.ammoClass] = 999;
    const individual = gun.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL;
    const capacity = gun.getCapacity(human);
    gun.ammo = individual
      ? Math.max(1, capacity - INDIVIDUAL_ROUNDS + 1)
      : Math.min(2, capacity);
    const shots = individual ? 1 : gun.ammo;
    for (let i = 0; i < shots; i++) {
      gun.pullTrigger(human);
      await this.wait(Math.max(1 / gun.stats.fireRate, 0.2));
    }
    await this.wait(0.4);
    gun.reload(human);
  }

  /** Starts over from the first demonstration */
  restart() {
    this.loop();
  }

  setMode(mode: RigMode) {
    this.mode = mode;
    this.restart();
  }

  /** Changes how fast everything plays: 0 stops it */
  setSpeed(speed: number) {
    this.speed = speed;
    this.paused = false;
    this.game.slowMo = speed;
  }

  togglePause() {
    this.paused = !this.paused;
    this.game.slowMo = this.paused ? 0 : this.speed;
  }

  /** Runs one frame at the current speed, while paused */
  step() {
    if (this.paused) {
      this.stepping = true;
      this.game.slowMo = this.speed;
    }
  }

  /** Moves each gun's animation on (or back) by `frames` frames of its own time, while paused */
  scrub(frames: number) {
    if (!this.paused) {
      return;
    }
    for (const human of this.humans) {
      const { animator } = human.weapon as Gun;
      const animation = animator.animation;
      if (animation) {
        animator.seek(
          animation,
          clamp(animator.time + frames * SCRUB_STEP, 0, animation.duration),
        );
      }
    }
  }

  get showingPoints(): boolean {
    return this.overlay !== undefined;
  }

  togglePoints() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = undefined;
    } else {
      this.overlay = this.addChild(new RigOverlay(() => this.humans));
    }
  }

  @on("tick")
  onTick() {
    // Everyone stands where they were put, and never gets hurt
    for (const human of this.humans) {
      human.hp = human.maxHp;
      human.body.velocity.set(0, 0);
      human.body.angle = 0;
    }
  }

  @on("afterPhysics")
  onAfterPhysics() {
    if (this.stepping) {
      this.stepping = false;
      this.game.slowMo = 0;
    }
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    const speedIndex = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(key);
    if (speedIndex >= 0) {
      this.setSpeed(RIG_SPEEDS[speedIndex]);
    } else if (key === "Space") {
      this.togglePause();
    } else if (key === "Period") {
      this.step();
    } else if (key === "ArrowLeft") {
      this.scrub(-1);
    } else if (key === "ArrowRight") {
      this.scrub(1);
    } else if (key === "KeyM") {
      const next = RIG_MODES.indexOf(this.mode) + 1;
      this.setMode(RIG_MODES[next % RIG_MODES.length]);
    } else if (key === "KeyG") {
      this.togglePoints();
    } else if (key === "Enter") {
      this.restart();
    }
  }
}

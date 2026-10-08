import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
import { clamp } from "../../core/util/MathUtil";
import { V } from "../../core/Vector";
import { slug } from "../arena/arenaConfig";
import { Character, CHARACTERS } from "../characters/Character";
import { Persistence } from "../constants/constants";
import { getVolumeController } from "../controllers/VolumeController";
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
import { getGunLayers, GUN_PIXELS_PER_METER } from "../weapons/guns/gunArt";
import {
  GunAnimations,
  GunStats,
  ReloadingStyle,
} from "../weapons/guns/GunStats";
import {
  RigCommand,
  RigReady,
  RigShow,
  RigStatus,
  RigView,
} from "./rigMessages";
import RigOverlay from "./RigOverlay";
import RigPanel from "./RigPanel";

/** Meters between the humans in the lineup */
const COLUMN_SPACING = 2.8;
const ROW_SPACING = 1.9;
const MAX_COLUMNS = 4;
/** Room around the lineup, in meters */
const MARGIN = 1.2;
/** The least the close view (`follow`) shows across, in meters */
const CLOSE_VIEW = 1.1;
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
 * holds them, `lefty` makes them left-handed, `columns` how many to a row (4), `zoom` the pixels per meter
 * (else the lineup fills the view), `speed` how fast it plays (`speed=0.25`
 * is quarter speed), and `points` marks the points on the guns and where the
 * hands are (`RigOverlay`). `follow` closes in on the first gun (a meter
 * across, or its length and a half). `embed` is for a page it's in (the gun
 * browser): no panel, and it's driven by messages (`rigMessages.ts`), which
 * can change the guns, who holds them, the mode, speed and view without
 * reloading. `?auto` hides the panel, for recording
 * (`npm run clip -- --scene rig`); `cycles` counts the demonstrations.
 * `rounds=50` starts magazine guns' demonstrations with that many rounds
 * (2 otherwise), all fired as fast as the gun goes.
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
  /** Rounds magazine guns start each demonstration with, if not the usual */
  private rounds?: number;
  private character: Character;
  private view: RigView = "lineup";
  /** Everything the lineup's made of, which goes when it's built again */
  private lineup: Entity[] = [];
  /** Driven by a page it's in (`embed`): see `rigMessages.ts` */
  private embedded: boolean;
  /** What the page last asked to be shown, so only what's changed is changed */
  private shown?: RigShow;
  private statusTime = 0;
  /** Animations held where they were scrubbed to, which would stay there once it's playing again */
  private seeked = false;

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
    this.rounds = Number(params.get("rounds")) || undefined;
    const chosen =
      CHARACTERS.find(
        (c) => slug(c.name) === slug(params.get("character") ?? ""),
      ) ?? CHARACTERS[0];
    this.character = params.has("lefty")
      ? { ...chosen, leftHanded: true }
      : chosen;
    this.embedded = params.has("embed");
    if (params.has("follow")) {
      this.view = "gun";
    }
  }

  @on("add")
  async onAdd() {
    const params = new URLSearchParams(window.location.search);
    // Humans carry lights, so this has to exist before anyone is added
    this.addChild(new LightingManager());
    this.addChild(new ContactShadows());
    this.build();

    if (params.has("points")) {
      this.togglePoints();
    }
    if (this.embedded) {
      window.addEventListener("message", this.onMessage);
      const ready: RigReady = { type: "rigReady" };
      window.parent?.postMessage(ready, window.location.origin);
    } else if (!params.has("auto")) {
      this.addChild(new RigPanel(this));
    }

    this.game.slowMo = this.speed;
    await this.wait(0.5);
    this.loop();
  }

  @on("destroy")
  onDestroy() {
    window.removeEventListener("message", this.onMessage);
  }

  /** Puts up the room and a human holding each gun, in place of what was there */
  private build() {
    for (const entity of this.lineup) {
      entity.destroy();
    }
    const params = new URLSearchParams(window.location.search);
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
    // Big enough for any view of it, close up or not
    const width = Math.max(lineupWidth, view[0] / zoom) + 2 * MARGIN;
    const height = Math.max(lineupHeight, view[1] / zoom) + 2 * MARGIN;
    const offset = V(width - lineupWidth, height - lineupHeight).imul(0.5);

    this.lineup = [
      new RepeatingFloor(cementFloor, [0, 0], [width, height]),
      new AmbientLight(0xdddddd),
      new Wall([0, 0], [width, 0]),
      new Wall([0, 0], [0, height]),
      new Wall([width, 0], [width, height]),
      new Wall([0, height], [width, height]),
    ];
    this.humans = this.guns.map((stats, i) => {
      const column = i % columns;
      const row = Math.floor(i / columns);
      const position = V(
        MARGIN / 2 + 0.6 + column * COLUMN_SPACING,
        MARGIN / 2 + ROW_SPACING / 2 + row * ROW_SPACING,
      ).iadd(offset);
      const human = new Human(position, this.character);
      human.body.angle = 0;
      this.lineup.push(human);
      // A page it's in shows the name itself, unless there's more than one
      if (!this.embedded || this.guns.length > 1) {
        this.lineup.push(
          new FloorText(position.add(V(0.9, 0.62)), stats.name, {
            heightMeters: 0.18,
            color: "#303030",
          }),
        );
      }
      return human;
    });
    this.addChildren(...this.lineup);
    this.humans.forEach((human, i) =>
      human.giveWeapon(new Gun(this.guns[i]), false),
    );

    this.lineupZoom = zoom;
    this.lineupCenter = V(width / 2, height / 2);
    this.frame();
  }

  private lineupZoom = 1;
  private lineupCenter = V(0, 0);

  /** Points the camera at the lineup, or close on the first gun */
  private frame() {
    const camera = this.game.camera;
    const first = this.humans[0];
    if (this.view === "lineup" || !first) {
      camera.z = this.lineupZoom;
      camera.center(this.lineupCenter);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const stats = this.guns[0];
    const view = this.game.renderer.getSize();
    // The gun's length (its art's) fills most of the view across, but no
    // less than a meter shows, so a pistol's hands do too
    const length = Math.max(
      ...getGunLayers(stats.art).map(
        (layer) => layer.texture.width / GUN_PIXELS_PER_METER,
      ),
    );
    const across = Math.max(length * 1.6, CLOSE_VIEW);
    camera.z =
      (this.embedded ? 0 : Number(params.get("zoom"))) ||
      Math.min(view[0] / across, view[1] / (across * 0.75));
    // Where the gun's middle is at rest
    const side = stats.holdPosition[1] + stats.sideOffset;
    camera.center(
      first.localToWorld([
        stats.holdPosition[0],
        this.character.leftHanded ? -side : side,
      ]),
    );
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
      await this.wait(
        longest > 0 ? longest + ANIMATION_GAP : CYCLE_TIME + this.firingTime(),
      );
      // Started over meanwhile
      if (this.cycles !== cycle) {
        return;
      }
    }
  }

  /** Seconds the slowest gun takes to fire `rounds`, if set */
  private firingTime(): number {
    const rounds = this.rounds ?? 0;
    return Math.max(0, ...this.guns.map((gun) => rounds / gun.fireRate));
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
      : Math.min(this.rounds ?? 2, capacity);
    // Built again meanwhile
    const gone = () => human.isDestroyed;
    if (this.rounds && !individual) {
      // As fast as it fires
      while (gun.ammo > 0 && !gone()) {
        gun.pullTrigger(human);
        await this.wait(1 / 120);
      }
    } else {
      const shots = individual ? 1 : gun.ammo;
      for (let i = 0; i < shots && !gone(); i++) {
        gun.pullTrigger(human);
        await this.wait(Math.max(1 / gun.stats.fireRate, 0.2));
      }
    }
    await this.wait(0.4);
    if (!gone()) {
      gun.reload(human);
    }
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

  /** Holds each gun's animation `progress` (0 to 1) of the way through, while paused: the mode's, or in the demonstration whatever's playing */
  seek(progress: number) {
    if (!this.paused) {
      return;
    }
    this.seeked = true;
    for (const human of this.humans) {
      const gun = human.weapon as Gun;
      const animation =
        this.mode === "demo"
          ? gun.animator.animation
          : gun.stats.animations[this.mode];
      if (animation) {
        gun.animator.seek(
          animation,
          clamp(progress, 0, 1) * animation.duration,
        );
      }
    }
  }

  /** What the page it's in asks for (`embed`) */
  private onMessage = (event: MessageEvent) => {
    const message = event.data as RigCommand;
    if (event.origin !== window.location.origin || !message?.type) {
      return;
    }
    switch (message.type) {
      case "rigShow":
        this.show(message);
        break;
      case "rigStep":
        this.step();
        break;
      case "rigSeek":
        if (!this.paused) {
          this.togglePause();
        }
        this.seek(message.progress);
        break;
      case "rigRestart":
        this.restart();
        break;
    }
  };

  private show(message: RigShow) {
    const last = this.shown;
    this.shown = message;
    getVolumeController(this.game).silence(message.muted);
    // The page's clicks count for an iframe of the same origin (`allow="autoplay"`)
    if (!message.muted && this.game.audio.state === "suspended") {
      this.game.audio.resume().catch(() => {});
    }
    const guns = message.guns
      .map((name) => GUNS.find((gun) => gun.name === name))
      .filter((gun) => gun !== undefined);
    const base =
      CHARACTERS.find((c) => c.name === message.character) ?? CHARACTERS[0];
    const lineupChanged =
      !last ||
      guns.length !== this.guns.length ||
      guns.some((gun, i) => gun !== this.guns[i]) ||
      base.name !== this.character.name ||
      message.leftHanded !== !!this.character.leftHanded;
    if (guns.length > 0 && lineupChanged) {
      this.guns = guns;
      this.character = { ...base, leftHanded: message.leftHanded };
      this.build();
    }
    if (message.view !== this.view) {
      this.view = message.view;
      this.frame();
    }
    if (message.points !== this.showingPoints) {
      this.togglePoints();
    }
    if (message.mode !== this.mode) {
      this.setMode(message.mode);
    } else if (lineupChanged) {
      this.restart();
    }
    if (message.speed !== this.speed || message.paused !== this.paused) {
      this.speed = message.speed;
      this.paused = message.paused;
      this.game.slowMo = this.paused ? 0 : this.speed;
      if (!this.paused && this.seeked) {
        this.seeked = false;
        this.restart();
      }
    }
  }

  /** Tells the page it's in how the first gun's doing */
  private postStatus() {
    const human = this.humans[0];
    const gun = human?.weapon;
    if (!(gun instanceof Gun)) {
      return;
    }
    const animation = gun.animator.animation;
    const name = (Object.keys(gun.stats.animations) as RigMode[]).find(
      (key) => key !== "demo" && gun.stats.animations[key] === animation,
    ) as keyof GunAnimations | undefined;
    const status: RigStatus = {
      type: "rigStatus",
      animation: name,
      progress: gun.animator.progress,
      duration: name ? gun.animationDuration(name, human) : 0,
      ammo: gun.ammo,
      capacity: gun.getCapacity(human),
      reloading: gun.isReloading,
    };
    window.parent?.postMessage(status, window.location.origin);
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

  @on("render")
  onRender(dt: number) {
    if (this.view === "gun") {
      // Recentered as the view's resized
      this.frame();
    }
    if (this.embedded) {
      this.statusTime += dt;
      if (this.statusTime > 1 / 20) {
        this.statusTime = 0;
        this.postStatus();
      }
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

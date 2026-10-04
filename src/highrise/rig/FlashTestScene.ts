import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
import { V } from "../../core/Vector";
import { slug } from "../arena/arenaConfig";
import { CHARACTERS } from "../characters/Character";
import { Persistence } from "../constants/constants";
import MuzzleFlash from "../effects/MuzzleFlash";
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
import { FireMode, GunStats } from "../weapons/guns/GunStats";

/** Meters between the humans in the lineup, and room for their flashes */
const ROW_SPACING = 1.4;
const LINEUP_WIDTH = 4;
/** Meters between the flashes in the gallery */
const GALLERY_COLUMN = 1.5;
const GALLERY_ROW = 0.9;
/** Seconds from one round of shots to the next */
const CYCLE_TIME = 1.5;
/** Seconds between one gun's shot and the next one's */
const STAGGER = 0.08;
/** Rounds in an automatic's burst */
const BURST = 4;
/** How far through its life each gallery flash is held, by default */
const GALLERY_AGE = 0.25;

/**
 * A dev-only scene for looking at muzzle flashes (`?scene=flash`), in the
 * dark: a column of humans, one per gun, firing a shot each in turn (a
 * burst, for automatics) over and over. `gallery` holds flashes still instead: a row per gun of `columns`
 * flashes (6), every one different, at `age` of the way through their lives
 * (0.25), or with `age=life` going from just fired to almost gone across the
 * row. `gun=ar15,glock` picks the guns (by `slug`), `zoom` the pixels per
 * meter, `speed` how fast it plays, `ambient` the darkness (a hex color).
 * `?auto` is for recording (`npm run clip -- --scene flash`).
 *
 * Keys: Enter shoots again (or remakes the gallery).
 */
export default class FlashTestScene extends BaseEntity implements Entity {
  id = "flashTestScene";
  persistenceLevel = Persistence.Permanent;
  /** Rounds of shots so far */
  cycles = 0;
  private humans: Human[] = [];
  private guns: GunStats[];
  private params = new URLSearchParams(window.location.search);
  private flashes: MuzzleFlash[] = [];

  constructor() {
    super();
    const wanted = this.params.get("gun")?.split(",").map(slug) ?? [];
    this.guns =
      wanted.length > 0
        ? wanted
            .map((name) => GUNS.find((gun) => slug(gun.name) === name))
            .filter((gun): gun is GunStats => gun !== undefined)
        : GUNS;
  }

  @on("add")
  async onAdd() {
    const params = this.params;
    const gallery = params.has("gallery");
    const columns = Number(params.get("columns")) || 6;
    const width = gallery ? columns * GALLERY_COLUMN + 1.2 : LINEUP_WIDTH;
    const height = this.guns.length * (gallery ? GALLERY_ROW : ROW_SPACING);

    const view = this.game.renderer.getSize();
    const zoom =
      Number(params.get("zoom")) ||
      Math.min(view[0] / width, view[1] / height) * 0.95;
    const roomWidth = Math.max(width, view[0] / zoom) + 4;
    const roomHeight = Math.max(height, view[1] / zoom);
    const offset = V((roomWidth - width) / 2, (roomHeight - height) / 2);

    this.addChild(new LightingManager());
    this.addChild(new ContactShadows());
    this.addChildren(
      new RepeatingFloor(cementFloor, [0, 0], [roomWidth, roomHeight]),
      new AmbientLight(parseInt(params.get("ambient") ?? "282828", 16)),
      new Wall([0, 0], [roomWidth, 0]),
      new Wall([0, 0], [0, roomHeight]),
      new Wall([roomWidth, 0], [roomWidth, roomHeight]),
      new Wall([0, roomHeight], [roomWidth, roomHeight]),
    );

    this.game.camera.z = zoom;
    this.game.camera.center(V(roomWidth / 2, roomHeight / 2));
    this.game.slowMo = Number(params.get("speed") ?? 1) || 1;

    if (gallery) {
      this.makeGallery(offset, columns);
      this.cycles = 1;
      return;
    }

    const character =
      CHARACTERS.find(
        (c) => slug(c.name) === slug(params.get("character") ?? ""),
      ) ?? CHARACTERS[0];
    this.humans = this.guns.map((stats, i) => {
      const position = V(0.6, (i + 0.5) * ROW_SPACING).iadd(offset);
      const human = this.addChild(new Human(position, character));
      human.body.angle = 0;
      human.giveWeapon(new Gun(stats), false);
      this.addChild(
        new FloorText(position.add(V(-0.1, 0.45)), stats.name, {
          heightMeters: 0.16,
          color: "#505050",
        }),
      );
      return human;
    });

    await this.wait(0.5);
    this.loop();
  }

  /** A row per gun of flashes held still */
  private makeGallery(offset: ReturnType<typeof V>, columns: number) {
    for (const flash of this.flashes) {
      flash.destroy();
    }
    const ageParam = this.params.get("age");
    this.flashes = [];
    this.guns.forEach((stats, row) => {
      this.addChild(
        new FloorText(
          V(0.5, (row + 0.5) * GALLERY_ROW + 0.3).iadd(offset),
          stats.name,
          { heightMeters: 0.14, color: "#505050" },
        ),
      );
      for (let column = 0; column < columns; column++) {
        const age =
          ageParam === "life"
            ? 0.05 + (0.9 * column) / Math.max(columns - 1, 1)
            : Number(ageParam ?? GALLERY_AGE);
        const position = V(
          1.2 + column * GALLERY_COLUMN,
          (row + 0.5) * GALLERY_ROW,
        ).iadd(offset);
        const flash = this.addChild(
          new MuzzleFlash(position, 0, stats.flash, undefined, age),
        );
        // Held still, their lights would light up the whole floor
        flash.light?.destroy();
        this.flashes.push(flash);
      }
    });
  }

  private async loop() {
    while (true) {
      const cycle = ++this.cycles;
      this.game.clearScene(Persistence.Floor);
      this.humans.forEach(async (human, i) => {
        await this.wait(i * STAGGER);
        const gun = human.weapon as Gun;
        gun.cancelReload();
        // Automatics fire a burst, so a run of flashes shows
        const rounds = gun.stats.fireMode === FireMode.FULL_AUTO ? BURST : 1;
        for (let round = 0; round < rounds; round++) {
          gun.ammo = gun.getCapacity(human);
          gun.shootCooldown = 0;
          gun.pullTrigger(human);
          await this.wait(1 / gun.stats.fireRate);
        }
      });
      await this.wait(CYCLE_TIME);
      if (this.cycles !== cycle) {
        return;
      }
    }
  }

  @on("tick")
  onTick() {
    for (const human of this.humans) {
      human.hp = human.maxHp;
      human.body.velocity.set(0, 0);
      human.body.angle = 0;
    }
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "Enter" && this.humans.length > 0) {
      this.loop();
    }
  }
}

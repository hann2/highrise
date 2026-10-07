import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { V } from "../../core/Vector";
import { slug } from "../arena/arenaConfig";
import { Character, CHARACTERS } from "../characters/Character";
import { Persistence } from "../constants/constants";
import { getVolumeController } from "../controllers/VolumeController";
import { cementFloor } from "../environment/decorations/floorDecorations";
import RepeatingFloor from "../environment/RepeatingFloor";
import Human from "../human/Human";
import { AmbientLight } from "../lighting-and-vision/AmbientLight";
import ContactShadows from "../lighting-and-vision/ContactShadows";
import LightingManager from "../lighting-and-vision/LightingManager";
import { BodyLook, resolveLook } from "../looks/BodyLook";
import { bakeBodies, forgetLook } from "../looks/bakeBodies";
import { BodyLayer } from "../looks/drawBody";
import { GUNS } from "../weapons/guns/gun-stats/gunStats";
import Gun from "../weapons/guns/Gun";
import { ReloadingStyle } from "../weapons/guns/GunStats";
import { MELEE_WEAPONS } from "../weapons/melee/melee-weapons/meleeWeapons";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import {
  PREVIEW_MODES,
  PreviewMode,
  PreviewReady,
  PreviewShow,
} from "./previewMessages";

/** The floor's size, in meters; the character stays round its middle */
const ROOM = 40;
/**
 * Walking round a circle this big (meters), at this share of their speed: big
 * enough that they turn as they go rather than crab-stepping round it
 */
const CIRCLE = 5;
const WALK_SPEED = 0.7;
/** How much of the view's smaller side the camera shows, in meters */
const VIEW = 1.8;
/** Seconds between one demonstration of the weapon and the next */
const CYCLE = 4.5;
/** Which way they face standing (up the screen) */
const FACING = -Math.PI / 2;

/**
 * `?scene=preview` (development only): the character editor's live preview,
 * in an iframe on the Appearance tab. One character, drawn and animated by
 * the game itself: walking round a circle empty-handed (`walk`) or with
 * their first starting weapon (`armed`), or standing, using it and reloading
 * (`shoot`). The camera follows them. The editor posts `PreviewShow`s with
 * the draft look, weapons and stats; each new look is baked again and the
 * old one forgotten. `character=andy` is who it shows until the first one,
 * and `mode=shoot` how (`npm run clip -- --scene preview --query mode=shoot`).
 * Silent, since it's beside the editor.
 */
export default class PreviewScene extends BaseEntity implements Entity {
  // The id and `cycles` are what `npm run clip -- --scene preview` waits for
  id = "previewTestScene";
  persistenceLevel = Persistence.Permanent;
  cycles = 0;
  private human?: Human;
  private mode: PreviewMode = "walk";
  /** The look shown, if it's one this scene baked (and so has to forget) */
  private ownLook?: BodyLook;
  private shown = "";
  /** Counts what's been asked for, so a slow bake that's been overtaken is dropped */
  private requests = 0;
  /** Counts the humans made, so an old one's demonstration stops */
  private generation = 0;
  private angle = 0;
  private hidden: ReadonlySet<BodyLayer> = new Set();

  @on("add")
  onAdd() {
    getVolumeController(this.game).silence(true);
    this.addChild(new LightingManager());
    this.addChild(new ContactShadows());
    this.addChildren(
      new RepeatingFloor(cementFloor, [0, 0], [ROOM, ROOM]),
      new AmbientLight(0xdddddd),
    );

    const params = new URLSearchParams(window.location.search);
    this.mode = PREVIEW_MODES.find((m) => m === params.get("mode")) ?? "walk";
    const character =
      CHARACTERS.find(
        (c) => slug(c.name) === slug(params.get("character") ?? ""),
      ) ?? CHARACTERS[0];
    this.place(character);
    this.cycles = 1;

    window.addEventListener("message", this.onMessage);
    const ready: PreviewReady = { type: "previewReady" };
    window.parent?.postMessage(ready, window.location.origin);
  }

  @on("destroy")
  onDestroy() {
    window.removeEventListener("message", this.onMessage);
  }

  private onMessage = async (event: MessageEvent) => {
    const message = event.data as PreviewShow;
    if (
      event.origin !== window.location.origin ||
      message?.type !== "previewShow"
    ) {
      return;
    }
    // Showing and hiding layers doesn't need a new body
    this.hidden = new Set(message.hidden);
    this.human?.humanSprite.setHiddenLayers(this.hidden);
    const { hidden: _, ...body } = message;
    const key = JSON.stringify(body);
    if (key === this.shown) {
      return;
    }
    this.shown = key;
    const request = ++this.requests;
    const look = resolveLook(message.look);
    await bakeBodies([look]);
    if (request !== this.requests || this.isDestroyed) {
      forgetLook(look);
      return;
    }
    const weapons = [...GUNS, ...MELEE_WEAPONS];
    this.mode = message.mode;
    const base = this.human?.character ?? CHARACTERS[0];
    const old = this.ownLook;
    this.ownLook = look;
    this.place({
      ...base,
      look,
      stats: message.stats,
      startingWeapons: message.startingWeapons
        .map((name) => weapons.find((weapon) => weapon.name === name))
        .filter((weapon) => weapon !== undefined),
      leftHanded: message.leftHanded,
    });
    if (old) {
      // Once the renderer has let go of its pages
      setTimeout(() => forgetLook(old), 500);
    }
  };

  /** Puts a new human where the last one was, armed for the mode */
  private place(character: Character) {
    const position = this.human?.getPosition().clone() ?? this.circlePoint(0);
    const angle =
      this.human?.body.angle ?? (this.mode === "shoot" ? FACING : -Math.PI / 2);
    this.human?.destroy();
    const human = this.addChild(new Human(position, character));
    human.body.angle = angle;
    if (this.mode !== "walk") {
      // Only the first: it's the one in hand
      const [first] = character.startingWeapons;
      if (first) {
        human.giveWeapon(
          "ammoClass" in first ? new Gun(first) : new MeleeWeapon(first),
          false,
        );
      }
    }
    this.human = human;
    human.humanSprite.setHiddenLayers(this.hidden);
    const generation = ++this.generation;
    if (this.mode === "shoot") {
      this.demonstrate(human, generation);
    }
  }

  private circlePoint(angle: number) {
    return V(ROOM / 2, ROOM / 2).iadd(V(CIRCLE, 0).irotate(angle));
  }

  /** Uses the weapon a few times and reloads, over and over */
  private async demonstrate(human: Human, generation: number) {
    await this.wait(0.6);
    while (generation === this.generation) {
      const weapon = human.weapon;
      if (weapon instanceof Gun) {
        weapon.cancelReload();
        human.reserve[weapon.stats.ammoClass] = 999;
        const individual =
          weapon.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL;
        const capacity = weapon.getCapacity(human);
        weapon.ammo = individual
          ? Math.max(1, capacity - 2)
          : Math.min(3, capacity);
        const shots = individual ? 1 : weapon.ammo;
        for (let i = 0; i < shots && generation === this.generation; i++) {
          human.useWeapon();
          await this.wait(Math.max(1 / weapon.stats.fireRate, 0.25));
        }
        await this.wait(0.4);
        if (generation === this.generation) {
          human.reload();
        }
      } else if (weapon instanceof MeleeWeapon) {
        for (let i = 0; i < 2 && generation === this.generation; i++) {
          human.useWeapon();
          await this.wait(0.9);
        }
      }
      await this.wait(CYCLE);
      // Shells and magazines on the floor
      this.game.clearScene(Persistence.Floor);
    }
  }

  @on("tick")
  onTick(dt: number) {
    const human = this.human;
    if (!human) {
      return;
    }
    human.hp = human.maxHp;
    if (this.mode === "shoot") {
      human.walkSpring.stop();
      human.body.velocity.set(0, 0);
      human.setDirection(FACING, dt);
      return;
    }
    // Round the circle anticlockwise, steering back onto it
    const offset = human.getPosition().sub(V(ROOM / 2, ROOM / 2));
    this.angle = offset.angle;
    const along = this.angle - Math.PI / 2;
    const correction = (offset.magnitude - CIRCLE) * 0.8;
    const heading = along - correction;
    human.walkSpring.walkTowards(heading, WALK_SPEED);
    human.setDirection(heading, dt);
  }

  @on("render")
  onRender() {
    if (this.human) {
      const size = this.game.renderer.getSize();
      this.game.camera.z = Math.min(size[0], size[1]) / VIEW;
      this.game.camera.center(this.human.getPosition());
    }
  }
}

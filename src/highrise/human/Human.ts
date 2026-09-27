import { SoundName } from "../../../resources/resources";
import { CollisionGroups } from "../../config/CollisionGroups";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import type Game from "../../core/Game";
import type { Body } from "../../core/physics/body/Body";
import { createPointMass2D } from "../../core/physics/body/bodyFactories";
import { Circle } from "../../core/physics/shapes/Circle";
import { PositionalSound } from "../../core/sound/PositionalSound";
import {
  angleDelta,
  clamp,
  clampUp,
  degToRad,
  polarToVec,
} from "../../core/util/MathUtil";
import { rDirection, rNormal, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Character, randomCharacter } from "../characters/Character";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../constants/constants";
import { WalkSpring } from "../creature-stuff/WalkSpring";
import FleshImpact from "../effects/FleshImpact";
import { isEnemy } from "../enemies/base/Enemy";
import Burning, { Flammable } from "../fire/Burning";
import {
  HUMAN_BURN_DPS,
  HUMAN_BURN_INTERVAL,
  HUMAN_BURN_TIME,
} from "../fire/fireConstants";
import { inflictDamageFrom } from "../run/damageSources";
import Door from "../environment/Door";
import Interactable, { isInteractable } from "../environment/Interactable";
import ConsumablePickup from "../environment/ConsumablePickup";
import UsablePickup from "../environment/UsablePickup";
import { UsableStats } from "../weapons/usables/UsableStats";
import { STIM_EFFECT } from "../weapons/usables/usables";
import WeaponPickup from "../environment/WeaponPickup";
import { PhasedAction } from "../utils/PhasedAction";
import { ShuffleRing } from "../utils/ShuffleRing";
import { ConsumableStats } from "../weapons/consumables/ConsumableStats";
import ThrownConsumable from "../weapons/consumables/ThrownConsumable";
import {
  AmmoClass,
  MAX_RESERVE,
  NEW_GUN_RESERVE_BONUS,
  STARTING_RESERVE,
} from "../weapons/guns/ammo";
import Gun from "../weapons/guns/Gun";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import { otherSlot, Weapon, WeaponSlot } from "../weapons/weapons";
import HumanSprite from "./HumanSprite";
import Flashlight from "./Flashlight";
import HumanVoice from "./HumanVoice";
import { NumericStat, PlayerStats } from "./PlayerStats";
import type { Attachment } from "../items/attachments";
import type { Item } from "../items/Item";
import type { Level } from "../levels/Level";

const MAX_ROTATION = 2 * Math.PI * 4; // Radians / second
const SPEED = 5.0; // meters / second
const HURT_SPEED = 3.0; // Speed while hurt
/** Sprinting multiplies the walking speed by this (and `PlayerStats.sprintSpeed`) */
export const SPRINT_MULTIPLIER = 1.6;
// How close to an interactable a wall hit can be and still count as reaching it
const REACH_TOLERANCE = 0.5; // meters
// How far from where a human died each of their two weapons lands
const DROP_SCATTER = 0.35; // meters

export const PUSH_RANGE = 0.8; // meters
export const PUSH_ANGLE = degToRad(70);
export const PUSH_KNOCKBACK = 110; // newtons?
export const PUSH_STUN = 0.75; // seconds
// The whole push (windup + push + winddown + cooldown) takes about half a second
export const PUSH_COOLDOWN = 0.3; // seconds
export const PUSH_DOOR_IMPULSE = 12; // newton-seconds, enough to fling a door open

/** Seconds between weapon swaps, so a mouse wheel flick doesn't swap back and forth */
export const SWAP_COOLDOWN = 0.25;
/** Health, and seconds of not being hurt, after a second chance at death */
const SECOND_CHANCE_HP = 50;
const SECOND_CHANCE_INVULNERABILITY = 2;
/** Seconds between uses of a usable */
const USE_COOLDOWN = 1;
/** Seconds between throwing consumables */
export const THROW_COOLDOWN = 0.6;

export const PUSH_SOUNDS: SoundName[] = [
  "cabbageHit1",
  "cabbageHit2",
  "cabbageHit3",
  "cabbageHit4",
  "cabbageHit5",
  "cabbageHit6",
  "cabbageHit7",
  "cabbageHit8",
  "cabbageHit10",
  "cabbageHit11",
];

const pushSoundRing = new ShuffleRing(PUSH_SOUNDS);

export default class Human extends BaseEntity implements Entity, Flammable {
  body: Body;
  tags = ["human"];
  /** Modifiers from items; neutral for anyone who hasn't bought any */
  stats = new PlayerStats();
  /** Items bought so far this run, in order */
  items: Item[] = [];
  /** Gun attachments owned, oldest first (see `attachmentsFor`) */
  attachments: Attachment[] = [];
  /** Goes up whenever `attachments` changes, so guns know to recompute their stats */
  attachmentsVersion = 0;
  hp: number = this.stats.maxHp;
  /** Two weapons of any kind (guns or melee), either slot may be empty */
  weapons: [Weapon | undefined, Weapon | undefined] = [undefined, undefined];
  /** Which slot is in hand */
  activeSlot: WeaponSlot = 0;
  /** Reserve rounds per ammo class */
  reserve: Record<AmmoClass, number> = { ...STARTING_RESERVE };
  /** Grenades and the like, one type at a time (the throwable slot) */
  consumable?: ConsumableStats;
  consumableCount: number = 0;
  /**
   * Running flat out: faster, but no using the weapon or reloading (unless
   * `stats.canShootWhileSprinting`). Set by the player's controller while
   * sprint is held and they're moving; allies never sprint.
   */
  sprinting = false;
  /** Not hurt by anything until this (game time, unpaused) */
  invulnerableUntil = -Infinity;
  /** A health pack or the like, used on yourself a charge at a time */
  usable?: { stats: UsableStats; charges: number };
  humanSprite: HumanSprite;
  voice: HumanVoice;
  walkSpring: WalkSpring;
  flashlight: Flashlight;
  /** Keycards carried, for opening locked rooms (see `KeycardLock`) */
  keycards: number = 0;
  burning?: Burning;
  burnTime = HUMAN_BURN_TIME;
  burnDps = HUMAN_BURN_DPS;
  burnDamageInterval = HUMAN_BURN_INTERVAL;

  constructor(
    position: V2d = V(0, 0),
    public character: Character = randomCharacter(),
  ) {
    super();

    Object.assign(this.stats, character.stats);
    this.hp = this.stats.maxHp;

    this.humanSprite = this.addChild(new HumanSprite(this));
    this.voice = this.addChild(new HumanVoice(this));
    this.flashlight = this.addChild(new Flashlight(this));

    this.body = createPointMass2D({
      motion: "dynamic",
      mass: 0.5,
      position: position.clone(),
    });

    this.body.addShape(
      new Circle({
        radius: HUMAN_RADIUS,
        collisionGroup: CollisionGroups.Humans,
        collisionMask: CollisionGroups.All,
      }),
    );

    this.addChild(this.pushAction);
    this.walkSpring = this.addChild(new WalkSpring(this.body, SPEED, 80));
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    game.entities.addFilter(isEnemy);
  }

  get maxHp(): number {
    return this.stats.maxHp;
  }

  @on("startLevel")
  onStartLevel(_: { level: Level }) {
    if (this.stats.floorHeal > 0 && this.hp < this.maxHp) {
      this.heal(this.stats.floorHeal, false);
    }
    if (this.stats.floorStimSeconds > 0) {
      this.applyTimedStats(STIM_EFFECT, this.stats.floorStimSeconds);
    }
  }

  @on("tick")
  onTick(dt: number) {
    const healthPercent = this.hp / this.maxHp;
    const speed = healthPercent < 0.3 ? HURT_SPEED : SPEED;
    const sprint = this.sprinting
      ? SPRINT_MULTIPLIER * this.stats.sprintSpeed
      : 1;
    this.walkSpring.speed = speed * this.stats.moveSpeed * sprint;

    if (this.weapon instanceof Gun) {
      this.weapon.updateWallRetraction(this, dt);
    }
  }

  // Have the human face a specific angle
  setDirection(angle: number, dt: number) {
    const angleDiff = angleDelta(this.body.angle, angle);
    const turnAmount = clamp(angleDiff, -MAX_ROTATION * dt, MAX_ROTATION * dt);
    this.body.angle += turnAmount;
  }

  setPosition(position: [number, number]) {
    this.body.position.set(position);
  }

  getDirection(): number {
    return this.body.angle;
  }

  /** Starts or stops sprinting. Starting cancels a reload it would block. */
  setSprinting(sprinting: boolean) {
    if (sprinting && !this.sprinting && this.weapon instanceof Gun) {
      if (!this.stats.canShootWhileSprinting) {
        this.weapon.cancelReload();
      }
    }
    this.sprinting = sprinting;
  }

  /** Whether sprinting keeps the weapon from being used or reloaded right now */
  get sprintBlocksWeapon(): boolean {
    return this.sprinting && !this.stats.canShootWhileSprinting;
  }

  useWeapon() {
    if (this.sprintBlocksWeapon) {
      return;
    }
    if (this.weapon instanceof Gun) {
      this.weapon.pullTrigger(this);
    } else if (this.weapon instanceof MeleeWeapon) {
      this.weapon.attack(this);
    }
  }

  reload() {
    if (this.sprintBlocksWeapon) {
      return;
    }
    if (this.weapon instanceof Gun) {
      this.weapon.reload(this);
    }
  }

  /** The weapon in hand */
  get weapon(): Gun | MeleeWeapon | undefined {
    return this.getWeaponInSlot(this.activeSlot);
  }

  /** The weapon that isn't in hand, if there is one */
  get otherWeapon(): Gun | MeleeWeapon | undefined {
    return this.getWeaponInSlot(otherSlot(this.activeSlot));
  }

  getWeaponInSlot(slot: WeaponSlot): Weapon | undefined {
    return this.weapons[slot];
  }

  /** The guns carried, in either slot */
  get guns(): Gun[] {
    return this.weapons.filter((weapon) => weapon instanceof Gun);
  }

  /**
   * Where a new weapon goes: the slot in hand if it's empty, else the other
   * one if that's empty, else the slot in hand (replacing what's there)
   */
  slotForNewWeapon(): WeaponSlot {
    if (!this.weapons[this.activeSlot]) {
      return this.activeSlot;
    }
    const other = otherSlot(this.activeSlot);
    return this.weapons[other] ? this.activeSlot : other;
  }

  /** Reserve rounds for a class of ammo */
  getReserve(ammoClass: AmmoClass): number {
    return this.reserve[ammoClass];
  }

  /** Takes up to `amount` rounds out of the reserve and returns how many it got */
  takeReserve(ammoClass: AmmoClass, amount: number): number {
    const taken = Math.min(amount, this.reserve[ammoClass]);
    this.reserve[ammoClass] -= taken;
    return taken;
  }

  /** Adds rounds to the reserve, up to what can be carried. Returns how many fit. */
  addReserve(ammoClass: AmmoClass, amount: number): number {
    const before = this.reserve[ammoClass];
    this.reserve[ammoClass] = Math.min(MAX_RESERVE[ammoClass], before + amount);
    return this.reserve[ammoClass] - before;
  }

  /**
   * Equip a weapon in a free slot, or in place of the one in hand if both are
   * full (see `slotForNewWeapon`), dropping whatever was there, and take it in
   * hand. `isPickup` is false for weapons a human spawns holding.
   */
  async giveWeapon(weapon: Weapon, isPickup: boolean = true) {
    const slot = this.slotForNewWeapon();
    this.dropWeapon(slot);
    this.weapons[slot] = weapon;
    this.activeSlot = slot;
    this.addChild(weapon, true);
    this.refreshWeaponSprite();

    if (weapon instanceof Gun && !weapon.reserveBonusGiven) {
      weapon.reserveBonusGiven = true;
      const { ammoClass } = weapon.stats;
      this.addReserve(ammoClass, NEW_GUN_RESERVE_BONUS[ammoClass]);
    }

    if (isPickup) {
      weapon.playSound("pickup", this.getPosition());
      await this.wait(0.5);
      this.voice.speak(weapon instanceof Gun ? "pickupGun" : "pickupMelee");
    }
  }

  /** Arms them with their character's starting weapons, if they have any */
  giveStartingWeapons() {
    for (const stats of this.character.startingWeapons) {
      const weapon =
        "ammoClass" in stats ? new Gun(stats) : new MeleeWeapon(stats);
      this.giveWeapon(weapon, false);
    }
  }

  /** Drops the weapon in `slot` (by default the one in hand) on the floor */
  dropWeapon(slot: WeaponSlot = this.activeSlot) {
    const weapon = this.getWeaponInSlot(slot);
    if (weapon) {
      if (weapon instanceof Gun) {
        weapon.cancelReload();
      }
      this.game.addEntity(new WeaponPickup(this.getPosition(), weapon));
      this.weapons[slot] = undefined;
      this.refreshWeaponSprite();
    }
  }

  /** Adds a gun attachment: it goes on every gun it fits from now on */
  addAttachment(attachment: Attachment) {
    this.attachments.push(attachment);
    this.attachmentsVersion += 1;
    // It may change how the gun in hand looks (a laser sight)
    this.refreshWeaponSprite();
  }

  /**
   * The attachments on `gun` in this human's hands: for each slot, the most
   * recently taken one that fits the gun's family
   */
  attachmentsFor(gun: Gun): Attachment[] {
    const bySlot = new Map<string, Attachment>();
    for (const attachment of this.attachments) {
      if (attachment.fits.includes(gun.stats.ammoClass)) {
        bySlot.set(attachment.slot, attachment);
      }
    }
    return [...bySlot.values()];
  }

  /** Takes the weapon in `slot` away for good (sold as a trade-in) */
  removeWeapon(slot: WeaponSlot) {
    const weapon = this.getWeaponInSlot(slot);
    if (weapon) {
      if (weapon instanceof Gun) {
        weapon.cancelReload();
      }
      this.weapons[slot] = undefined;
      weapon.destroy();
      this.refreshWeaponSprite();
    }
  }

  /** When the last swap happened, in game seconds */
  private lastSwapTime = -Infinity;

  /** Whether the weapon in hand can be put away right now */
  canSwapWeapon(): boolean {
    const weapon = this.weapon;
    return (
      this.otherWeapon !== undefined &&
      this.game.elapsedTime - this.lastSwapTime >= SWAP_COOLDOWN &&
      !(weapon instanceof MeleeWeapon && weapon.currentSwing)
    );
  }

  /** Puts away the weapon in hand and takes out the other one */
  swapWeapon() {
    if (!this.canSwapWeapon()) {
      return;
    }
    const weapon = this.weapon;
    if (weapon instanceof Gun) {
      weapon.cancelReload();
    }
    this.lastSwapTime = this.game.elapsedTime;
    this.activeSlot = otherSlot(this.activeSlot);
    this.refreshWeaponSprite();
    const newWeapon = this.weapon;
    if (newWeapon instanceof Gun) {
      newWeapon.playSound("pickup", this.getPosition());
    } else if (newWeapon instanceof MeleeWeapon) {
      newWeapon.playSound("pickup", this.getPosition());
    }
  }

  refreshWeaponSprite() {
    this.humanSprite.handleDropWeapon();
    const weapon = this.weapon;
    if (weapon) {
      this.humanSprite.handleNewWeapon(weapon);
    }
  }

  /**
   * Adds consumables. Only one type is carried at a time, so a different
   * type replaces what was carried, which is dropped on the floor.
   */
  giveConsumable(stats: ConsumableStats, count: number): number {
    if (this.consumable && this.consumable !== stats) {
      this.dropConsumables();
    }
    const taken = Math.min(count, stats.maxCarry - this.consumableCount);
    if (taken > 0) {
      this.consumable = stats;
      this.consumableCount += taken;
    }
    return Math.max(0, taken);
  }

  private dropConsumables() {
    if (this.consumable && this.consumableCount > 0 && this.isAdded) {
      this.game.addEntity(
        new ConsumablePickup(
          this.getPosition(),
          this.consumable,
          this.consumableCount,
        ),
      );
    }
    this.consumable = undefined;
    this.consumableCount = 0;
  }

  /**
   * Takes a usable with `charges` charges. A different kind replaces the one
   * carried, which is dropped; the same kind tops it up. False if there was
   * no room for any of it.
   */
  giveUsable(stats: UsableStats, charges: number = stats.charges): boolean {
    const current = this.usable;
    if (current && current.stats === stats) {
      if (current.charges >= stats.charges) {
        return false;
      }
      current.charges = Math.min(stats.charges, current.charges + charges);
      return true;
    }
    if (current && current.charges > 0 && this.isAdded) {
      this.game.addEntity(
        new UsablePickup(this.getPosition(), current.stats, current.charges),
      );
    }
    this.usable = { stats, charges };
    return true;
  }

  private lastUseTime = -Infinity;

  /** Uses a charge of the usable carried, if it would do anything */
  useUsable() {
    const usable = this.usable;
    if (
      !usable ||
      this.game.elapsedTime - this.lastUseTime < USE_COOLDOWN ||
      !usable.stats.use(this)
    ) {
      return;
    }
    this.lastUseTime = this.game.elapsedTime;
    usable.charges -= 1;
    if (usable.charges <= 0) {
      this.usable = undefined;
    }
  }

  /** Heals `amount` spread over `seconds` */
  async healOverTime(amount: number, seconds: number) {
    this.voice.speak("pickupHealth");
    await this.wait(seconds, (dt) => {
      this.hp = Math.min(this.hp + (amount * dt) / seconds, this.maxHp);
    });
    this.game.dispatch("humanHealed", { human: this, amount });
  }

  /**
   * Multiplies some of `stats` for `seconds` (a stim), then divides them back,
   * so it stacks with anything else that multiplies the same stats
   */
  async applyTimedStats(
    multipliers: Partial<Record<NumericStat, number>>,
    seconds: number,
  ) {
    const entries = Object.entries(multipliers) as [NumericStat, number][];
    for (const [stat, multiplier] of entries) {
      this.stats[stat] *= multiplier;
    }
    await this.wait(seconds);
    for (const [stat, multiplier] of entries) {
      this.stats[stat] /= multiplier;
    }
  }

  private lastThrowTime = -Infinity;

  /** Throws one of the carried consumables the way the human is facing */
  useConsumable() {
    const stats = this.consumable;
    if (
      !stats ||
      this.consumableCount <= 0 ||
      this.game.elapsedTime - this.lastThrowTime < THROW_COOLDOWN
    ) {
      return;
    }
    this.lastThrowTime = this.game.elapsedTime;
    this.consumableCount -= 1;
    if (this.consumableCount <= 0) {
      this.consumable = undefined;
    }
    const direction = this.getDirection();
    const velocity = polarToVec(direction, stats.throwSpeed).iadd(
      this.body.velocity,
    );
    const position = this.getPosition().add(
      polarToVec(direction, HUMAN_RADIUS),
    );
    this.game.addEntity(new ThrownConsumable(stats, position, velocity, this));
  }

  /**
   * All usable interactables within range and not behind a wall, nearest
   * first, with the passive ones (which only say what they are) after the rest
   */
  getNearbyInteractables(): Interactable[] {
    return [...this.game.entities.getByFilter(isInteractable)]
      .filter(
        (i) =>
          i.getPosition().distanceTo(this.body.position) < i.maxDistance &&
          i.canInteract(this) &&
          (!i.needsLineOfSight || this.canReach(i)),
      )
      .sort(
        (i1, i2) =>
          Number(i1.passive) - Number(i2.passive) ||
          i1.getPosition().distanceTo(this.body.position) -
            i2.getPosition().distanceTo(this.body.position),
      );
  }

  // Whether nothing solid is between us and the interactable, so that a
  // closet's contents can't be grabbed through its locked door
  private canReach(interactable: Interactable): boolean {
    const target = interactable.getPosition();
    const hit = this.game.world.raycast(this.body.position, target, {
      collisionMask: CollisionGroups.Walls,
      skipBackfaces: true,
    });
    if (!hit) {
      return true;
    }
    // The thing we're reaching for may be solid itself (a vending machine,
    // the card reader on a door), in which case hitting it is fine
    return (
      hit.body === interactable.parent?.body ||
      hit.point.distanceTo(target) < REACH_TOLERANCE
    );
  }

  // Interacts with the nearest interactable within range if there is one
  interactWithNearest(): Interactable | null {
    const nearest = this.getNearbyInteractables()[0];
    if (!nearest || nearest.passive) {
      return null;
    }
    nearest.interact(this);
    return nearest;
  }

  /**
   * Inflict damage on the human. `quiet` leaves out the blood and the pained
   * noises, for damage that keeps coming (burning).
   */
  async inflictDamage(amount: number, quiet: boolean = false) {
    if (
      this.isDestroyed ||
      this.game.elapsedUnpausedTime < this.invulnerableUntil
    ) {
      return;
    }
    amount *= this.stats.damageTaken;
    this.hp -= amount;
    // A second chance (Second Heart): back up, and untouchable for a moment
    if (this.hp <= 0 && this.stats.extraLives > 0) {
      this.stats.extraLives -= 1;
      this.hp = SECOND_CHANCE_HP;
      this.invulnerableUntil =
        this.game.elapsedUnpausedTime + SECOND_CHANCE_INVULNERABILITY;
    }

    if (!quiet) {
      this.game.addEntity(new FleshImpact(this.getPosition(), 1));
    }
    this.game.dispatch("humanInjured", { human: this, amount });

    if (this.hp <= 0) {
      this.die();
    } else if (quiet) {
      return;
    } else if (this.hp < 30) {
      await this.wait(0.2);
      this.voice.speak("nearDeath", true);
    } else {
      await this.wait(0.2);
      this.voice.speak("hurt");
    }
  }

  handleIgnite() {
    this.voice.speak("hurt");
  }

  takeBurnDamage(amount: number) {
    inflictDamageFrom(this, amount, "Fire", true);
  }

  die() {
    if (this.isDestroyed) {
      return;
    }
    this.voice.speak("death", true);
    this.game.dispatch("humanDied", { human: this });
    this.game.addEntity(new FleshImpact(this.getPosition(), 6));

    // Scattered a little apart, rather than one on top of the other
    const weapons = this.weapons.filter(
      (weapon): weapon is Weapon => weapon !== undefined,
    );
    const scatterAngle = rDirection();
    weapons.forEach((weapon, i) => {
      const offset =
        weapons.length > 1
          ? polarToVec(
              scatterAngle + i * Math.PI + rUniform(-0.4, 0.4),
              rUniform(DROP_SCATTER * 0.7, DROP_SCATTER),
            )
          : V(0, 0);
      this.game.addEntity(
        new WeaponPickup(this.getPosition().iadd(offset), weapon),
      );
    });
    this.destroy();
  }

  /** A push's damage, before `stats.damage`: more with a bayonet on the gun in hand */
  getPushDamage(): number {
    const weapon = this.weapon;
    const bayonets =
      weapon instanceof Gun
        ? this.attachmentsFor(weapon).reduce(
            (sum, attachment) => sum + (attachment.pushDamage ?? 0),
            0,
          )
        : 0;
    return this.stats.pushDamage + bayonets;
  }

  heal(amount: number, speak: boolean = true) {
    if (speak) {
      this.voice.speak("pickupHealth");
    }
    this.hp = Math.min(this.hp + amount, this.maxHp);
    this.game.dispatch("humanHealed", { human: this, amount });
  }

  pushAction = new PhasedAction([
    {
      name: "windup",
      duration: 0.06,
    },
    {
      name: "push",
      duration: 0.05,
      startAction: () => {
        this.game.addEntity(
          new PositionalSound("swordSwoosh1", this.getPosition()),
        );
        const enemies = this.game.entities.getByFilter(isEnemy);
        for (const enemy of enemies) {
          const relPosition = enemy.getPosition().isub(this.getPosition());
          const distance = clampUp(
            relPosition.magnitude - HUMAN_RADIUS - ZOMBIE_RADIUS,
          );
          const theta = Math.abs(
            angleDelta(relPosition.angle, this.body.angle),
          );

          if (distance < PUSH_RANGE && theta < PUSH_ANGLE) {
            const amount =
              (PUSH_KNOCKBACK -
                0.5 * PUSH_KNOCKBACK * (distance / PUSH_RANGE)) *
              this.stats.pushKnockback;
            enemy.knockback(relPosition.inormalize().imul(amount));
            enemy.stun(PUSH_STUN * this.stats.pushStun * rNormal(1, 0.2));
            enemy.takeHit(this.getPushDamage() * this.stats.damage, this);
            this.game.addEntity(
              new PositionalSound(pushSoundRing.getNext(), this.getPosition(), {
                gain: Math.min(1, amount / PUSH_KNOCKBACK),
                speed: rNormal(1, 0.05),
              }),
            );
          }
        }

        for (const door of this.game.entities.getByConstructor(Door)) {
          this.pushDoor(door);
        }
      },
    },
    {
      name: "winddown",
      duration: 0.1,
    },
    {
      name: "cooldown",
      duration: PUSH_COOLDOWN,
    },
  ]);

  /** Fling a door open if part of it is within the push cone. */
  private pushDoor(door: Door) {
    const position = this.getPosition();
    let closest: V2d | undefined;
    let closestDistance = PUSH_RANGE;
    for (const point of door.getPointsAlong(9)) {
      const relPosition = point.sub(position);
      const distance = clampUp(relPosition.magnitude - HUMAN_RADIUS);
      const theta = Math.abs(angleDelta(relPosition.angle, this.body.angle));
      if (distance < closestDistance && theta < PUSH_ANGLE) {
        closest = point;
        closestDistance = distance;
      }
    }
    if (closest) {
      const amount =
        PUSH_DOOR_IMPULSE -
        0.5 * PUSH_DOOR_IMPULSE * (closestDistance / PUSH_RANGE);
      door.hitByPush(polarToVec(this.body.angle, amount), closest);
    }
  }

  canPush() {
    const isPushing = this.pushAction.isActive();
    const isSwinging = !!(this.weapon as Partial<MeleeWeapon> | undefined)
      ?.currentSwing;
    return !isPushing && !isSwinging;
  }

  push() {
    if (this.canPush()) {
      this.pushAction.do();
    }
  }
}

export function isHuman(e: Entity): e is Human {
  return e instanceof Human;
}

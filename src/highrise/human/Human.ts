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
import { rNormal } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Character, randomCharacter } from "../characters/Character";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../constants/constants";
import { WalkSpring } from "../creature-stuff/WalkSpring";
import FleshImpact from "../effects/FleshImpact";
import { isEnemy } from "../enemies/base/Enemy";
import Door from "../environment/Door";
import Interactable, { isInteractable } from "../environment/Interactable";
import ConsumablePickup from "../environment/ConsumablePickup";
import WeaponPickup from "../environment/WeaponPickup";
import { PhasedAction } from "../utils/PhasedAction";
import { ShuffleRing } from "../utils/ShuffleRing";
import { ConsumableStats } from "../weapons/consumables/ConsumableStats";
import ThrownConsumable from "../weapons/consumables/ThrownConsumable";
import {
  AmmoClass,
  isLimitedAmmo,
  LimitedAmmoClass,
  MAX_RESERVE,
  NEW_GUN_RESERVE_BONUS,
  STARTING_RESERVE,
} from "../weapons/guns/ammo";
import Gun from "../weapons/guns/Gun";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import { otherSlot, slotFor, WeaponSlot } from "../weapons/weapons";
import HumanSprite from "./HumanSprite";
import Flashlight from "./Flashlight";
import HumanVoice from "./HumanVoice";
import { PlayerStats } from "./PlayerStats";
import type { Upgrade } from "../upgrades/Upgrade";
import type { Level } from "../levels/Level";

const MAX_ROTATION = 2 * Math.PI * 4; // Radians / second
const SPEED = 5.0; // meters / second
const HURT_SPEED = 3.0; // Speed while hurt
// How close to an interactable a wall hit can be and still count as reaching it
const REACH_TOLERANCE = 0.5; // meters

export const PUSH_RANGE = 0.8; // meters
export const PUSH_ANGLE = degToRad(70);
export const PUSH_KNOCKBACK = 110; // newtons?
export const PUSH_STUN = 0.75; // seconds
// The whole push (windup + push + winddown + cooldown) takes about half a second
export const PUSH_COOLDOWN = 0.3; // seconds
export const PUSH_DOOR_IMPULSE = 12; // newton-seconds, enough to fling a door open

/** Seconds between weapon swaps, so a mouse wheel flick doesn't swap back and forth */
export const SWAP_COOLDOWN = 0.25;
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

export default class Human extends BaseEntity implements Entity {
  body: Body;
  tags = ["human"];
  /** Modifiers from upgrades; neutral for anyone who hasn't picked any */
  stats = new PlayerStats();
  /** Upgrades picked so far this run, in order */
  upgrades: Upgrade[] = [];
  hp: number = this.stats.maxHp;
  /** Rifles and shotguns: limited ammo */
  primary?: Gun;
  /** Pistols and melee weapons: unlimited */
  secondary?: Gun | MeleeWeapon;
  /** Which slot is in hand */
  activeSlot: WeaponSlot = "primary";
  /** Reserve rounds per ammo class; pistol ammo is unlimited */
  reserve: Record<LimitedAmmoClass, number> = { ...STARTING_RESERVE };
  /** Grenades and the like, one type at a time */
  consumable?: ConsumableStats;
  consumableCount: number = 0;
  humanSprite: HumanSprite;
  voice: HumanVoice;
  walkSpring: WalkSpring;
  flashlight: Flashlight;
  /** Keycards carried, for opening locked rooms (see `KeycardLock`) */
  keycards: number = 0;

  constructor(
    position: V2d = V(0, 0),
    public character: Character = randomCharacter(),
  ) {
    super();

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
  }

  @on("tick")
  onTick() {
    const healthPercent = this.hp / this.maxHp;
    const speed = healthPercent < 0.3 ? HURT_SPEED : SPEED;
    this.walkSpring.speed = speed * this.stats.moveSpeed;
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

  useWeapon() {
    if (this.weapon instanceof Gun) {
      this.weapon.pullTrigger(this);
    } else if (this.weapon instanceof MeleeWeapon) {
      this.weapon.attack(this);
    }
  }

  reload() {
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

  getWeaponInSlot(slot: WeaponSlot): Gun | MeleeWeapon | undefined {
    return slot === "primary" ? this.primary : this.secondary;
  }

  private setWeaponInSlot(slot: WeaponSlot, weapon: Gun | MeleeWeapon) {
    if (slot === "primary") {
      if (!(weapon instanceof Gun)) {
        throw new Error(`${weapon.stats.name} can't be a primary`);
      }
      this.primary = weapon;
    } else {
      this.secondary = weapon;
    }
  }

  /** Reserve rounds for a class of ammo. Pistol ammo never runs out. */
  getReserve(ammoClass: AmmoClass): number {
    return isLimitedAmmo(ammoClass) ? this.reserve[ammoClass] : Infinity;
  }

  /** Takes up to `amount` rounds out of the reserve and returns how many it got */
  takeReserve(ammoClass: AmmoClass, amount: number): number {
    if (!isLimitedAmmo(ammoClass)) {
      return amount;
    }
    const taken = Math.min(amount, this.reserve[ammoClass]);
    this.reserve[ammoClass] -= taken;
    return taken;
  }

  /** Adds rounds to the reserve, up to what can be carried. Returns how many fit. */
  addReserve(ammoClass: AmmoClass, amount: number): number {
    if (!isLimitedAmmo(ammoClass)) {
      return 0;
    }
    const before = this.reserve[ammoClass];
    this.reserve[ammoClass] = Math.min(MAX_RESERVE[ammoClass], before + amount);
    return this.reserve[ammoClass] - before;
  }

  /**
   * Equip a weapon in its slot (see `slotFor`), dropping whatever was in that
   * slot, and take it in hand. `isPickup` is false for weapons a human spawns
   * holding.
   */
  async giveWeapon(weapon: Gun | MeleeWeapon, isPickup: boolean = true) {
    const slot = slotFor(weapon);
    this.dropWeapon(slot);
    this.setWeaponInSlot(slot, weapon);
    this.activeSlot = slot;
    this.addChild(weapon, true);
    this.refreshWeaponSprite();

    if (weapon instanceof Gun && !weapon.reserveBonusGiven) {
      weapon.reserveBonusGiven = true;
      const { ammoClass } = weapon.stats;
      if (isLimitedAmmo(ammoClass)) {
        this.addReserve(ammoClass, NEW_GUN_RESERVE_BONUS[ammoClass]);
      }
    }

    if (isPickup) {
      weapon.playSound("pickup", this.getPosition());
      await this.wait(0.5);
      this.voice.speak(weapon instanceof Gun ? "pickupGun" : "pickupMelee");
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
      if (slot === "primary") {
        this.primary = undefined;
      } else {
        this.secondary = undefined;
      }
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

  private refreshWeaponSprite() {
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

  // Return a list of all interactables within range and not behind a wall
  getNearbyInteractables(): Interactable[] {
    return [...this.game.entities.getByFilter(isInteractable)]
      .filter(
        (i) =>
          i.getPosition().distanceTo(this.body.position) < i.maxDistance &&
          this.canReach(i),
      )
      .sort(
        (i1, i2) =>
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
    const interactables = this.getNearbyInteractables();
    if (interactables.length > 0) {
      interactables[0].interact(this);
      return interactables[0];
    } else {
      return null;
    }
  }

  // Inflict damage on the human
  async inflictDamage(amount: number) {
    if (this.isDestroyed) {
      return;
    }
    this.hp -= amount;

    this.game.addEntity(new FleshImpact(this.getPosition(), 1));
    this.game.dispatch("humanInjured", { human: this, amount });

    if (this.hp <= 0) {
      this.die();
    } else if (this.hp < 30) {
      await this.wait(0.2);
      this.voice.speak("nearDeath", true);
    } else {
      await this.wait(0.2);
      this.voice.speak("hurt");
    }
  }

  die() {
    if (this.isDestroyed) {
      return;
    }
    this.voice.speak("death", true);
    this.game.dispatch("humanDied", { human: this });
    this.game.addEntity(new FleshImpact(this.getPosition(), 6));

    for (const weapon of [this.primary, this.secondary]) {
      if (weapon) {
        this.game.addEntity(new WeaponPickup(this.getPosition(), weapon));
      }
    }
    this.destroy();
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
            enemy.takeHit(this.stats.pushDamage * this.stats.damage, this);
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

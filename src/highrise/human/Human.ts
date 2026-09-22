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
import GlowStick from "../effects/GlowStick";
import { isEnemy } from "../enemies/base/Enemy";
import Interactable, { isInteractable } from "../environment/Interactable";
import WeaponPickup from "../environment/WeaponPickup";
import { PhasedAction } from "../utils/PhasedAction";
import { ShuffleRing } from "../utils/ShuffleRing";
import Gun from "../weapons/guns/Gun";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import HumanSprite from "./HumanSprite";
import Flashlight from "./Flashlight";
import HumanVoice from "./HumanVoice";

const MAX_ROTATION = 2 * Math.PI * 4; // Radians / second
const SPEED = 5.0; // meters / second
const HURT_SPEED = 3.0; // Speed while hurt
const MAX_HEALTH = 100;

export const PUSH_RANGE = 0.8; // meters
export const PUSH_ANGLE = degToRad(70);
export const PUSH_KNOCKBACK = 110; // newtons?
export const PUSH_STUN = 0.75; // seconds
export const PUSH_COOLDOWN = 0.1; // seconds

export const GLOWSTICK_COOLDOWN = 1.0; // seconds

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
  maxHp: number = MAX_HEALTH;
  hp: number = MAX_HEALTH;
  weapon?: Gun | MeleeWeapon;
  humanSprite: HumanSprite;
  voice: HumanVoice;
  walkSpring: WalkSpring;

  constructor(
    position: V2d = V(0, 0),
    public character: Character = randomCharacter(),
  ) {
    super();

    this.humanSprite = this.addChild(new HumanSprite(this));
    this.voice = this.addChild(new HumanVoice(this));
    this.addChild(new Flashlight(this));

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

    this.addChild(this.glowstickAction);
    this.addChild(this.pushAction);
    this.walkSpring = this.addChild(new WalkSpring(this.body, SPEED, 80));
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    game.entities.addFilter(isEnemy);
  }

  @on("tick")
  onTick() {
    const healthPercent = this.hp / this.maxHp;
    if (healthPercent < 0.3) {
      this.walkSpring.speed = HURT_SPEED;
    } else {
      this.walkSpring.speed = SPEED;
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

  /** Equip a weapon. `isPickup` is false for weapons a human spawns holding. */
  async giveWeapon(weapon: Gun | MeleeWeapon, isPickup: boolean = true) {
    if (this.weapon) {
      this.dropWeapon();
    }
    this.weapon = weapon;
    this.addChild(weapon, true);
    this.humanSprite.handleNewWeapon(weapon);

    if (isPickup) {
      weapon.playSound("pickup", this.getPosition());
      await this.wait(0.5);
      this.voice.speak(weapon instanceof Gun ? "pickupGun" : "pickupMelee");
    }
  }

  dropWeapon() {
    if (this.weapon) {
      this.game.addEntity(new WeaponPickup(this.getPosition(), this.weapon));
      this.weapon = undefined;
      this.humanSprite.handleDropWeapon();
    }
  }

  // Return a list of all interactables within range
  getNearbyInteractables(): Interactable[] {
    return (
      [...this.game.entities.getByFilter(isInteractable)]
        // .filter((i) => testLineOfSight(i, this)) // TODO: Fast vision test for interactables
        .filter(
          (i) => i.getPosition().distanceTo(this.body.position) < i.maxDistance,
        )
        .sort(
          (i1, i2) =>
            i1.getPosition().distanceTo(this.body.position) -
            i2.getPosition().distanceTo(this.body.position),
        )
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

    if (this.weapon) {
      this.game.addEntity(new WeaponPickup(this.getPosition(), this.weapon));
    }
    this.destroy();
  }

  heal(amount: number) {
    this.voice.speak("pickupHealth");
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
              PUSH_KNOCKBACK - 0.5 * PUSH_KNOCKBACK * (distance / PUSH_RANGE);
            enemy.knockback(relPosition.inormalize().imul(amount));
            enemy.stun(PUSH_STUN * rNormal(1, 0.2));
            enemy.voice.speak("hit");
            this.game.addEntity(
              new PositionalSound(pushSoundRing.getNext(), this.getPosition(), {
                gain: amount / PUSH_KNOCKBACK,
                speed: rNormal(1, 0.05),
              }),
            );
          }
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

  glowstickAction = new PhasedAction([
    {
      name: "windup",
      duration: 0.0,
    },
    {
      name: "throw",
      duration: 0.1,
      startAction: () => {
        this.game.addEntity(
          new GlowStick(
            this.getPosition(),
            polarToVec(this.getDirection(), rNormal(5, 1)).iadd(
              this.body.velocity,
            ),
          ),
        );
      },
    },
    {
      name: "cooldown",
      duration: GLOWSTICK_COOLDOWN,
    },
  ]);

  throwGlowstick() {
    if (!this.glowstickAction.isActive()) {
      this.glowstickAction.do();
    }
  }
}

export function isHuman(e: Entity): e is Human {
  return e instanceof Human;
}

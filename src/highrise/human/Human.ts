import { Body, Circle } from "p2";
import snd_cabbageHit1 from "../../../resources/audio/food/individual/cabbage-hit-1.flac";
import snd_cabbageHit10 from "../../../resources/audio/food/individual/cabbage-hit-10.flac";
import snd_cabbageHit11 from "../../../resources/audio/food/individual/cabbage-hit-11.flac";
import snd_cabbageHit2 from "../../../resources/audio/food/individual/cabbage-hit-2.flac";
import snd_cabbageHit3 from "../../../resources/audio/food/individual/cabbage-hit-3.flac";
import snd_cabbageHit4 from "../../../resources/audio/food/individual/cabbage-hit-4.flac";
import snd_cabbageHit5 from "../../../resources/audio/food/individual/cabbage-hit-5.flac";
import snd_cabbageHit6 from "../../../resources/audio/food/individual/cabbage-hit-6.flac";
import snd_cabbageHit7 from "../../../resources/audio/food/individual/cabbage-hit-7.flac";
import snd_cabbageHit8 from "../../../resources/audio/food/individual/cabbage-hit-8.flac";
import snd_swordSwoosh1 from "../../../resources/audio/weapons/sword-swoosh-1.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import type Game from "../../core/Game";
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
import { CollisionGroups } from "../config/CollisionGroups";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../constants";
import FleshImpact from "../effects/FleshImpact";
import GlowStick from "../effects/GlowStick";
import { isEnemy } from "../enemies/base/Enemy";
import Interactable, { isInteractable } from "../environment/Interactable";
import WeaponPickup from "../environment/WeaponPickup";
import { PointLight } from "../lighting-and-vision/PointLight";
import { PhasedAction } from "../utils/PhasedAction";
import { ShuffleRing } from "../utils/ShuffleRing";
import Gun from "../weapons/Gun";
import MeleeWeapon from "../weapons/MeleeWeapon";
import Flashlight from "./Flashlight";
import HumanSprite from "./HumanSprite";
import HumanVoice from "./HumanVoice";

const MAX_ROTATION = 2 * Math.PI * 4; // Radians / second
const SPEED = 3.5; // arbitrary units
const HURT_SPEED = 3.0; // Speed while hurt
const FRICTION = 0.4; // arbitrary units
const MAX_HEALTH = 100;

export const PUSH_RANGE = 0.8; // meters
export const PUSH_ANGLE = degToRad(70);
export const PUSH_KNOCKBACK = 110; // newtons?
export const PUSH_STUN = 0.75; // seconds
export const PUSH_COOLDOWN = 0.1; // seconds

export const GLOWSTICK_COOLDOWN = 1.0; // seconds

export const PUSH_SOUNDS = [
  snd_cabbageHit1,
  snd_cabbageHit2,
  snd_cabbageHit3,
  snd_cabbageHit4,
  snd_cabbageHit5,
  snd_cabbageHit6,
  snd_cabbageHit7,
  snd_cabbageHit8,
  snd_cabbageHit10,
  snd_cabbageHit11,
];

const pushSoundRing = new ShuffleRing(PUSH_SOUNDS);

export default class Human extends BaseEntity implements Entity {
  body: Body;
  tags = ["human"];
  hp: number = MAX_HEALTH;
  weapon?: Gun | MeleeWeapon;
  light?: PointLight;
  humanSprite: HumanSprite;
  voice: HumanVoice;

  constructor(
    position: V2d = V(0, 0),
    public character: Character = randomCharacter()
  ) {
    super();

    this.humanSprite = this.addChild(new HumanSprite(this));
    this.voice = this.addChild(new HumanVoice(this));
    this.addChild(new Flashlight(this));

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      fixedRotation: true,
    });

    const shape = new Circle({ radius: HUMAN_RADIUS });
    shape.collisionGroup = CollisionGroups.Humans;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);

    this.addChild(this.glowstickAction);
    this.addChild(this.pushAction);
  }

  onAdd(game: Game) {
    game.entities.addFilter(isEnemy);
  }

  onTick(dt: number) {
    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  // Move the human along a specified vector
  walk(direction: V2d) {
    let speed = SPEED;
    const healthPercent = this.hp / MAX_HEALTH;
    if (healthPercent < 0.3) {
      speed = HURT_SPEED;
    }
    this.body.applyImpulse(direction.mul(speed));
  }

  // Have the human face a specific angle
  setDirection(angle: number, dt: number = this.game!.tickTimestep) {
    const angleDiff = angleDelta(this.body.angle, angle);
    const turnAmount = clamp(angleDiff, -MAX_ROTATION * dt, MAX_ROTATION * dt);
    this.body.angle += turnAmount;
  }

  setPosition([x, y]: [number, number]) {
    this.body.position[0] = x;
    this.body.position[1] = y;
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

  async giveWeapon(weapon: Gun | MeleeWeapon, shouldSpeak: boolean = true) {
    if (this.weapon) {
      this.dropWeapon();
    }
    this.weapon = weapon;
    this.addChild(weapon, true);
    this.game?.dispatch({ type: "giveWeapon", human: this, weapon });
    weapon.playSound("pickup", this.getPosition());
    this.humanSprite.onGiveWeapon(weapon);

    if (shouldSpeak) {
      await this.wait(0.5);
      this.voice.speak(weapon instanceof Gun ? "pickupGun" : "pickupMelee");
    }
  }

  dropWeapon() {
    if (this.weapon) {
      this.game?.addEntity(new WeaponPickup(this.getPosition(), this.weapon));
      this.weapon = undefined;
      this.humanSprite.onDropWeapon();
    }
  }

  // Return a list of all interactables within range
  getNearbyInteractables(): Interactable[] {
    const result = [];

    return (
      [...this.game!.entities.getByFilter(isInteractable)]
        // .filter((i) => testLineOfSight(i, this)) // TODO: Fast vision test for interactables
        .filter(
          (i) =>
            i.getPosition().sub(this.body.position).magnitude < i.maxDistance
        )
        .sort(
          (i1, i2) =>
            i1.getPosition().sub(this.body.position).magnitude -
            i2.getPosition().sub(this.body.position).magnitude
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
    this.hp -= amount;

    this.game?.addEntity(new FleshImpact(this.getPosition(), 1));

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
    this.voice.speak("death", true);
    this.game?.dispatch({ type: "humanDied", human: this });
    this.game?.addEntity(new FleshImpact(this.getPosition(), 6));

    if (this.weapon) {
      this.game?.addEntity(new WeaponPickup(this.getPosition(), this.weapon));
    }
    this.destroy();
  }

  heal(amount: number) {
    this.voice.speak("pickupHealth");

    this.hp += amount;
    if (this.hp > MAX_HEALTH) {
      this.hp = MAX_HEALTH;
    }
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
        this.game?.addEntity(
          new PositionalSound(snd_swordSwoosh1, this.getPosition())
        );
        const enemies = this.game!.entities.getByFilter(isEnemy);
        for (const enemy of enemies) {
          const relPosition = enemy.getPosition().isub(this.getPosition());
          const distance = clampUp(
            relPosition.magnitude - HUMAN_RADIUS - ZOMBIE_RADIUS
          );
          const theta = Math.abs(
            angleDelta(relPosition.angle, this.body.angle)
          );

          if (distance < PUSH_RANGE && theta < PUSH_ANGLE) {
            const amount =
              PUSH_KNOCKBACK - 0.5 * PUSH_KNOCKBACK * (distance / PUSH_RANGE);
            enemy.knockback(relPosition.inormalize().imul(amount));
            enemy.stun(PUSH_STUN * rNormal(1, 0.2));
            enemy.voice.speak("hit");
            this.game?.addEntity(
              new PositionalSound(pushSoundRing.getNext(), this.getPosition(), {
                gain: amount / PUSH_KNOCKBACK,
                speed: rNormal(1, 0.05),
              })
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

  push() {
    if (!this.pushAction.isActive()) {
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
        this.game?.addEntity(
          new GlowStick(
            this.getPosition(),
            polarToVec(this.getDirection(), rNormal(5, 1)).iadd(
              this.body.velocity
            )
          )
        );
      },
    },
    {
      name: "cooldown",
      duration: GLOWSTICK_COOLDOWN,
    },
  ]);

  async throwGlowstick() {
    if (!this.glowstickAction.isActive()) {
      this.glowstickAction.do();
    }
  }
}

export function isHuman(e: Entity): e is Human {
  return e instanceof Human;
}

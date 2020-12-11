import { Body, Circle } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { angleDelta, clamp, normalizeAngle } from "../../../core/util/MathUtil";
import { rBool } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import {
  Character,
  CharacterSoundClass,
  randomCharacter,
} from "../../characters/Character";
import BloodSplat from "../../effects/BloodSplat";
import { PointLight } from "../../lighting/PointLight";
import { CollisionGroups } from "../../physics/CollisionGroups";
import Gun from "../../weapons/Gun";
import { FireMode } from "../../weapons/GunStats";
import Interactable, { isInteractable } from "../Interactable";
import MeleeWeapon from "../../weapons/MeleeWeapon";
import WeaponPickup from "../WeaponPickup";
import HumanSprite from "./HumanSprite";
import HumanVoice from "./HumanVoice";
import Flashlight from "./Flashlight";

export const HUMAN_RADIUS = 0.35; // meters
const MAX_ROTATION = 2 * Math.PI * 4; // Radians / second
const SPEED = 3.5; // arbitrary units
const FRICTION = 0.4; // arbitrary units
const INTERACT_DISTANCE = 3; // meters
const MAX_HEALTH = 100;

export default class Human extends BaseEntity implements Entity {
  body: Body;
  tags = ["human"];
  hp: number = MAX_HEALTH;
  weapon?: Gun | MeleeWeapon;
  light?: PointLight;
  humanSprite: HumanSprite; // TODO: Communicate through events instead
  voice: HumanVoice;
  // flashLight: DirectionalLight;

  constructor(
    position: V2d = V(0, 0),
    public character: Character = randomCharacter()
  ) {
    super();

    this.humanSprite = this.addChild(new HumanSprite(this));
    this.voice = this.addChild(new HumanVoice(this));

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      fixedRotation: true,
    });

    const shape = new Circle({ radius: HUMAN_RADIUS });
    shape.collisionGroup = CollisionGroups.Humans;
    shape.collisionMask = CollisionGroups.All ^ CollisionGroups.Bullets;
    this.body.addShape(shape);

    this.addChild(new Flashlight(this));
  }

  onTick(dt: number) {
    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  // Move the human along a specified vector
  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(SPEED));
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
      this.voice.speak("pickupItem");
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
    return (
      this.game!.entities.getByFilter(isInteractable)
        // .filter((i) => testLineOfSight(i, this))
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
  inflictDamage(amount: number) {
    this.hp -= amount;

    if (this.hp <= 0) {
      this.die();
    } else if (this.hp < 30) {
      this.voice.speak("nearDeath", true); // TODO: We actually probably want this delayed a bit
    } else {
      this.voice.speak("hurt");
    }
  }

  die() {
    this.voice.speak("death", true);
    this.game?.dispatch({ type: "humanDied", human: this });
    this.game?.addEntity(new BloodSplat(this.getPosition()));
    this.destroy();
  }

  heal(amount: number) {
    this.voice.speak("pickupItem");

    this.hp += amount;
    if (this.hp > MAX_HEALTH) {
      this.hp = MAX_HEALTH;
    }
  }
}

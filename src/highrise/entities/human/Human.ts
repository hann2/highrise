import { Body, Circle } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { normalizeAngle } from "../../../core/util/MathUtil";
import { choose, rBool } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { Character, CharacterSoundClass } from "../../characters/Character";
import { randomCharacter } from "../../characters/characters";
import { CollisionGroups } from "../../Collision";
import { PointLight } from "../../lighting/PointLight";
import Bullet from "../Bullet";
import Gun from "../guns/Gun";
import { FireMode } from "../guns/GunStats";
import Hittable from "../Hittable";
import Interactable, { isInteractable } from "../Interactable";
import MeleeWeapon from "../meleeWeapons/MeleeWeapon";
import SwingingWeapon from "../meleeWeapons/SwingingWeapon";
import WeaponPickup from "../WeaponPickup";
import HumanSprite from "./HumanSprite";

export const HUMAN_RADIUS = 0.4; // meters
const SPEED = 4; // arbitrary units
const FRICTION = 0.4; // arbitrary units
const INTERACT_DISTANCE = 3; // meters
const MAX_HEALTH = 100;

export default class Human extends BaseEntity implements Entity, Hittable {
  body: Body;
  tags = ["human"];
  hp: number = MAX_HEALTH;
  weapon?: Gun | MeleeWeapon;
  light: PointLight;
  humanSprite: HumanSprite; // TODO: Communicate through events instead
  // flashLight: DirectionalLight;

  constructor(
    position: V2d = V(0, 0),
    public character: Character = randomCharacter()
  ) {
    super();

    this.humanSprite = this.addChild(new HumanSprite(this));

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      fixedRotation: true,
    });

    const shape = new Circle({ radius: HUMAN_RADIUS });
    shape.collisionGroup = CollisionGroups.Humans;
    shape.collisionMask = CollisionGroups.All ^ CollisionGroups.Bullets;
    this.body.addShape(shape);

    this.light = this.addChild(new PointLight(5, 0.4, 0xffffee, true));
    // this.flashLight = this.addChild(
    //   new DirectionalLight(15, degToRad(30), 0.6)
    // );
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onTick(dt: number) {
    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  afterPhysics() {
    this.light.setPosition(this.body.position);
    // this.flashLight.setPosition(this.body.position);
    // this.flashLight.setDirection(this.body.angle);
  }

  // Move the human along a specified vector
  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(SPEED));
  }

  // Have the human face a specific angle
  setDirection(angle: number) {
    this.body.angle = normalizeAngle(angle);
  }

  setPosition(position: V2d) {
    this.body.position[0] = position[0];
    this.body.position[1] = position[1];
  }

  getDirection(): number {
    return this.body.angle;
  }

  useWeapon() {
    if (this.weapon instanceof Gun) {
      this.weapon.pullTrigger(this);

      if (this.weapon.stats.fireMode === FireMode.FULL_AUTO) {
        if (rBool(1 / 1000)) {
          // TODO: Also this could be way better
          this.speak("taunts");
        }
      } else {
        if (rBool(1 / 200)) {
          // TODO: Also this could be way better
          this.speak("taunts");
        }
      }
    } else if (this.weapon instanceof MeleeWeapon) {
      this.weapon.attack(this);

      if (rBool(1 / 100)) {
        // TODO: Also this could be way better
        this.speak("taunts");
      }
    }
  }

  reload() {
    if (this.weapon instanceof Gun) {
      this.weapon.reload(this);
    }
  }

  async giveWeapon(weapon: Gun | MeleeWeapon, shouldSpeak: boolean = true) {
    console.log(weapon.stats.name);
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
      this.speak("pickupItem");
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
            i.getPosition().sub(this.getPosition()).magnitude <
            INTERACT_DISTANCE
        )
        .sort(
          (i1, i2) =>
            i1.getPosition().sub(this.getPosition()).magnitude -
            i2.getPosition().sub(this.getPosition()).magnitude
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

  onBulletHit(bullet: Bullet, position: V2d) {
    this.hp -= bullet.damage;

    this.game!.addEntity(new PositionalSound(choose("fleshHit1"), position));

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  // Inflict damage on the human
  inflictDamage(amount: number) {
    this.hp -= amount;

    if (this.hp <= 0) {
      this.speak("death");
      this.game?.dispatch({ type: "humanDied", human: this });
      this.destroy();
    } else if (this.hp < 30) {
      this.speak("nearDeath"); // TODO: We actually probably want this delayed a bit
    } else {
      this.speak("hurt");
    }
  }

  heal(amount: number) {
    this.speak("pickupItem");

    this.hp += amount;
    if (this.hp > MAX_HEALTH) {
      this.hp = MAX_HEALTH;
    }
  }

  speak(soundClass: CharacterSoundClass) {
    // TODO: Only speak one sound at a time
    const sounds = this.character.sounds[soundClass];
    if (sounds.length > 0) {
      const sound = choose(...sounds);
      this.game?.addEntity(new PositionalSound(sound, this.getPosition()));
    }
  }
}

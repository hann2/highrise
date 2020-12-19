import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import {
  clamp,
  degToRad,
  polarToVec,
  stepToward,
} from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { HUMAN_RADIUS } from "../constants";
import { BodySprite } from "../creature-stuff/BodySprite";
import Gun from "../weapons/Gun";
import MeleeWeapon from "../weapons/MeleeWeapon";
import Human, { PUSH_COOLDOWN } from "./Human";

const GUN_SCALE = 1 / 300;
const STANCE_ADJUST_SPEED = 3; // meters per second
const STANCE_ROTATE_SPEED = Math.PI * 2; // radians per second

// Renders a human
export default class HumanSprite extends BodySprite {
  private _stanceAngle: number = 0;
  private _stanceOffset: V2d = V(0, 0);

  weaponSprite?: Sprite;

  constructor(private human: Human) {
    super(human.character.textures, HUMAN_RADIUS);
  }

  onTick(dt: number) {
    const { body, weapon } = this.human;
    [this.sprite.x, this.sprite.y] = body.position;
    this.sprite.rotation = body.angle;

    this._stanceAngle = stepToward(
      this._stanceAngle,
      this.getTargetStanceAngle(),
      dt * STANCE_ROTATE_SPEED
    );

    const targetStanceOffset = this.getTargetStanceOffset();
    this._stanceOffset[0] = stepToward(
      this._stanceOffset[0],
      targetStanceOffset[0],
      dt * STANCE_ADJUST_SPEED
    );
    this._stanceOffset[1] = stepToward(
      this._stanceOffset[1],
      targetStanceOffset[1],
      dt * STANCE_ADJUST_SPEED
    );
  }

  onRender(dt: number) {
    super.onRender(dt);

    const weapon = this.human.weapon;
    if (weapon && this.weaponSprite) {
      if (weapon instanceof MeleeWeapon) {
        this.weaponSprite.visible = weapon.currentCooldown <= 0;
      } else {
        this.weaponSprite.position.set(...weapon.getCurrentHoldPosition());
      }
    }
  }

  getTargetStanceAngle(): number {
    if (this.human.weapon instanceof Gun) {
      return this.human.weapon.stats.stanceAngle;
    } else {
      return 0;
    }
  }

  getPosition() {
    return this.human.getPosition();
  }

  getAngle() {
    return this.human.getDirection();
  }

  getTargetStanceOffset(): [number, number] {
    if (this.human.weapon instanceof Gun) {
      return this.human.weapon.stats.stanceOffset;
    } else {
      return [0, 0];
    }
  }

  getStanceAngle() {
    return this._stanceAngle;
  }

  getStanceOffset() {
    return this._stanceOffset;
  }

  getRecoilOffset(gun: Gun): number {
    return -0.125 * gun.getCurrentRecoilAmount() ** 1.5;
  }

  getHandPositions(): [V2d, V2d] {
    const { weapon } = this.human;
    if (weapon) {
      // TODO: Arms while pushing with weapon
      return weapon.getCurrentHandPositions();
    } else {
      // Wave em in the air like you just don't care?
      const x = 0.1 + clamp(this.human.pushCooldown / PUSH_COOLDOWN) * 0.4;
      const y = Math.sin(this.game!.elapsedTime * 2) * 0.05;
      return [V(x, -0.2 + y), V(x, 0.2 - y)];
    }
  }

  async onGiveWeapon(weapon: Gun | MeleeWeapon) {
    if (weapon instanceof Gun) {
      const { textures, muzzleLength } = weapon.stats;
      this.weaponSprite = Sprite.from(textures.holding);
      this.weaponSprite.scale.set(GUN_SCALE);
      this.weaponSprite.anchor.set(0.5, 0.5);
      this.weaponSprite.position.set(...weapon.getCurrentHoldPosition());
      this.sprite.addChild(this.weaponSprite);
    } else if (weapon instanceof MeleeWeapon) {
      const { handlePosition, textures, size } = weapon.stats;
      const { restAngle, restPosition } = weapon.swing;

      this.weaponSprite = Sprite.from(textures.hold);
      this.weaponSprite.scale.set(size[1] / this.weaponSprite.height);
      this.weaponSprite.anchor.set(...handlePosition);
      this.weaponSprite.rotation = Math.PI / 2 + restAngle;
      this.weaponSprite.position.set(...restPosition);
      this.sprite.addChild(this.weaponSprite);
    }
  }

  onDropWeapon() {
    if (this.weaponSprite) {
      this.sprite.removeChild(this.weaponSprite);
      this.weaponSprite = undefined;
    }
  }
}

import { getAppearance } from "../looks/bakeBodies";
import { Sprite } from "pixi.js";
import { on } from "../../core/entity/handler";
import { lerp, smoothStep, stepToward } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { HUMAN_RADIUS } from "../constants/constants";
import { BodySprite } from "../creature-stuff/BodySprite";
import { HUMAN_GAIT } from "../creature-stuff/Legs";
import { LaserSight } from "../effects/LaserSight";
import Gun from "../weapons/guns/Gun";
import { GunPose } from "../weapons/guns/GunPose";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import Human from "./Human";

const GUN_SCALE = 1 / 300;
const STANCE_ROTATE_SPEED = Math.PI * 2; // radians per second
/** Radians a push twists a gun per meter it shoves it */
const PUSH_TWIST = 1;
/** How far an empty hand swings for each meter its opposite foot steps */
const ARM_SWING = 0.4;

// Renders a human
export default class HumanSprite extends BodySprite {
  private _stanceAngle: number = 0;

  weaponSprite?: Sprite;
  /** The magazine (or round) a gun's animation shows in the hand */
  magazineSprite?: Sprite;
  laserSight?: LaserSight;
  /** The gun in hand's pose, worked out at the start of `updatePose` */
  private gunPose?: GunPose;
  /** Whether the left hand and arm are drawn over the weapon right now */
  private leftHandOver = false;

  constructor(private human: Human) {
    const appearance = getAppearance(human.character.look);
    super(appearance.standing, HUMAN_RADIUS, {
      colors: appearance.legColors,
      gait: HUMAN_GAIT,
    });
  }

  @on("tick")
  onTick(dt: number) {
    const { body } = this.human;
    this.sprite.position.copyFrom(body.position);
    this.sprite.rotation = body.angle;

    this._stanceAngle = stepToward(
      this._stanceAngle,
      this.getTargetStanceAngle(),
      dt * STANCE_ROTATE_SPEED,
    );
  }

  updatePose() {
    const weapon = this.human.weapon;
    const pushOffset = this.getPushOffset();
    this.gunPose =
      weapon instanceof Gun
        ? weapon.getPose(pushOffset, pushOffset * PUSH_TWIST)
        : undefined;

    super.updatePose();

    const pose = this.gunPose;
    if (weapon instanceof MeleeWeapon && this.weaponSprite) {
      this.weaponSprite.visible = weapon.currentCooldown <= 0;
      this.weaponSprite.position.copyFrom(
        V(weapon.swing.restPosition).iadd([pushOffset, 0]),
      );
    } else if (pose && this.weaponSprite) {
      this.weaponSprite.position.copyFrom(pose.position);
      this.weaponSprite.rotation = pose.angle;
    }

    if (this.magazineSprite) {
      const inHand = pose?.magazine.place === "hand";
      this.magazineSprite.visible = inHand;
      if (inHand) {
        this.magazineSprite.position.copyFrom(pose.magazine.position);
        this.magazineSprite.rotation = pose.magazine.angle;
      }
    }

    this.setLeftHandOver(pose?.leftHandOver ?? false);
  }

  /** Draws the left hand and arm over the weapon, or back under the body where they belong */
  private setLeftHandOver(over: boolean) {
    if (over !== this.leftHandOver) {
      this.leftHandOver = over;
      this.arrangeLeftHand();
    }
  }

  /**
   * Puts the left arm and hand, and the magazine it carries, on top of
   * everything, or under the body (where `BodySprite` has the arms and
   * hands, over the legs) but over the right arm, so the magazine's seen.
   * The hand's over the magazine.
   */
  private arrangeLeftHand() {
    const left = [this.leftArmSprite, this.leftHandSprite];
    if (this.magazineSprite) {
      left.splice(1, 0, this.magazineSprite);
    }
    if (this.leftHandOver) {
      this.sprite.addChild(...left);
    } else {
      const bottom = this.legsSprite ? 1 : 0;
      [this.rightArmSprite, this.rightHandSprite, ...left].forEach(
        (sprite, i) => this.sprite.addChildAt(sprite, bottom + i),
      );
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

  getStanceAngle() {
    return this._stanceAngle;
  }

  getHandPositions(): [V2d, V2d] {
    const { weapon } = this.human;
    const pushOffset = this.getPushOffset();
    if (this.gunPose) {
      return [this.gunPose.leftHand, this.gunPose.rightHand];
    } else if (weapon instanceof MeleeWeapon) {
      const [left, right] = weapon.getCurrentHandPositions();
      return [left.iadd([pushOffset, 0]), right.iadd([pushOffset, 0])];
    } else {
      // Wave em in the air like you just don't care? Each swings with the other side's foot.
      const x = 0.3 + pushOffset;
      const y = Math.sin(this.game.elapsedTime * 2) * 0.05;
      const [leftSwing, rightSwing] = this.getArmSwing();
      return [V(x + leftSwing, -0.2 + y), V(x + rightSwing, 0.2 - y)];
    }
  }

  /** How far forward each empty hand swings as they walk: with the other side's foot, forward the way they face */
  private getArmSwing(): [number, number] {
    const gait = this.gait;
    if (!gait) {
      return [0, 0];
    }
    const forward = Math.cos(gait.travelAngle - this.getAngle());
    return [
      gait.along(1) * forward * ARM_SWING,
      gait.along(0) * forward * ARM_SWING,
    ];
  }

  getPushOffset(): number {
    const pushPhase = this.human.pushAction.currentPhase?.name;
    const t = smoothStep(this.human.pushAction.phasePercent);

    switch (pushPhase) {
      case undefined:
        return 0;
      case "windup":
        return lerp(0, -0.2, t);
      case "push":
        return lerp(-0.2, 0.2, t);
      case "winddown":
        return lerp(0.2, 0, t);
      default:
        return 0;
    }
  }

  handleNewWeapon(weapon: Gun | MeleeWeapon) {
    if (weapon instanceof Gun) {
      const { textures, magazine } = weapon.stats;
      if (magazine) {
        this.magazineSprite = Sprite.from(magazine.texture);
        this.magazineSprite.anchor.set(0.5, 0.5);
        this.magazineSprite.scale.set(
          magazine.length / this.magazineSprite.texture.width,
        );
        this.magazineSprite.visible = false;
        this.arrangeLeftHand();
      }

      this.weaponSprite = Sprite.from(textures.holding);
      this.weaponSprite.scale.set(GUN_SCALE);
      this.weaponSprite.anchor.set(0.5, 0.5);
      this.sprite.addChild(this.weaponSprite);

      // Its own, or one from a Laser Sight attachment
      const { laserSightColor } = weapon.effectiveStats(this.human);
      if (laserSightColor) {
        this.laserSight = this.addChild(
          new LaserSight(
            () => this.getMuzzlePosition(),
            () => weapon.getCurrentHoldAngle() + this.getAngle(),
            undefined,
            laserSightColor,
          ),
        );
      }
    } else if (weapon instanceof MeleeWeapon) {
      const { pivotPosition, textures, size } = weapon.stats;
      const { restAngle, restPosition } = weapon.swing;

      this.weaponSprite = Sprite.from(textures.hold);
      this.weaponSprite.scale.set(size[1] / this.weaponSprite.height);
      this.weaponSprite.anchor.set(...pivotPosition);
      this.weaponSprite.rotation = Math.PI / 2 + restAngle;
      this.weaponSprite.position.set(...restPosition);
      this.sprite.addChild(this.weaponSprite);
    }
  }

  /** Where the gun's muzzle is in the world (from the body, not the sprite, which isn't posed out of view) */
  getMuzzlePosition() {
    const gun = this.human.weapon;
    if (gun instanceof Gun) {
      const localPosition = gun.getMuzzlePosition();
      localPosition.angle += this.getAngle();
      return localPosition.iadd(this.getPosition());
    }
    return V(0, 0);
  }

  handleDropWeapon() {
    this.setLeftHandOver(false);
    for (const sprite of [this.weaponSprite, this.magazineSprite]) {
      if (sprite) {
        this.sprite.removeChild(sprite);
        sprite.destroy();
      }
    }
    this.weaponSprite = undefined;
    this.magazineSprite = undefined;
    this.laserSight?.destroy();
    this.laserSight = undefined;
  }
}

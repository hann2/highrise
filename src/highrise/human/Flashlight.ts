import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { degToRad, polarToVec } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import { DirectionalLight } from "../lighting-and-vision/DirectionalLight";
import Gun from "../weapons/guns/Gun";
import Human from "./Human";

/** How far the flashlight reaches with no upgrades, in meters */
const BASE_LENGTH = 8;

/** How far back from the muzzle the flashlight is mounted, in meters */
const MOUNT_BEHIND_MUZZLE = 0.15;

/**
 * A flashlight that follows a human's aim, mounted under the barrel of the
 * gun in hand (or held in the hands with anything else). Starts off.
 */
export default class Flashlight extends BaseEntity implements Entity {
  light: DirectionalLight;
  private length = BASE_LENGTH;

  constructor(private human: Human) {
    super();
    this.light = this.addChild(makeLight(this.length));
    this.light.enabled = false;
  }

  get isOn(): boolean {
    return this.light.enabled;
  }

  toggle() {
    this.light.enabled = !this.light.enabled;
  }

  @on("render")
  onRender() {
    // The light's size is baked into its texture, so a new range needs a new light
    const length = BASE_LENGTH * this.human.stats.flashlightRange;
    if (length !== this.length) {
      this.length = length;
      const enabled = this.light.enabled;
      this.light.destroy();
      this.light = this.addChild(makeLight(length));
      this.light.enabled = enabled;
    }

    // Only rebakes when the light actually moved or turned
    const [position, direction] = this.getMount();
    this.light.setPosition(position);
    this.light.setDirection(direction);
  }

  /** Where the light is in the world, and which way it points */
  private getMount(): [V2d, number] {
    const weapon = this.human.weapon;
    if (weapon instanceof Gun) {
      const holdAngle = weapon.getCurrentHoldAngle();
      const local = weapon
        .getMuzzlePosition()
        .isub(polarToVec(holdAngle, MOUNT_BEHIND_MUZZLE));
      return [
        this.human.localToWorld(local),
        this.human.getDirection() + holdAngle,
      ];
    }
    return [this.human.getPosition(), this.human.getDirection()];
  }
}

function makeLight(length: number): DirectionalLight {
  return new DirectionalLight({
    length,
    spread: degToRad(35),
    intensity: 0.7,
    color: 0xfff1d6,
    sourceRadius: 0.1,
  });
}

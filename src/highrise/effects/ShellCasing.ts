import { Sprite } from "pixi.js";
import shellDrop1 from "../../../resources/audio/guns/misc/shell-drop-1.mp3";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { SoundName } from "../../core/resources/sounds";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { clamp, degToRad, polarToVec } from "../../core/util/MathUtil";
import { rNormal, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layers } from "../layers";
import { ShuffleRing } from "../utils/ShuffleRing";

const LINEAR_FRICTION = 3;
const ANGULAR_FRICTION = 1.0;
const SIZE = 0.025; // meters wide

const SPEED = 7; // meters
const MAX_SPIN = Math.PI * 20;

const MIN_BOUNCE_SPEED = 1.0; // meters / second
const BOUNCE_RESTITUTION = 0.3; // percent of engergy retained in bounce

const PORT_HEIGHT = 1.0; // meters off the ground

// TODO: Different sound depending on floor

export default class ShellCasing extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  velocity: V2d;
  spin: number;
  z: number = PORT_HEIGHT;
  zVelocity: number;
  bounceSounds: ShuffleRing<string>;

  constructor(
    private position: V2d,
    direction: number,
    private rotation: number,
    texture: string,
    sounds: SoundName[] = [shellDrop1]
  ) {
    super();

    this.sprite = Sprite.from(texture);
    this.sprite.layerName = Layers.WORLD_BACK;
    this.sprite.scale.set(SIZE / this.sprite.texture.width);
    this.sprite.anchor.set(0.5, 0.5);

    this.velocity = polarToVec(
      rNormal(direction, degToRad(20)),
      SPEED * rNormal(1, 0.3)
    );

    this.spin = rUniform(MAX_SPIN / 10, MAX_SPIN);

    this.zVelocity = rUniform(0, 2);

    this.bounceSounds = new ShuffleRing(sounds);
  }

  async onAdd() {
    // TODO: Should we destroy these? It's kinda fun having them around.
    //       maybe just make a maximum number of them and start deleting the oldest
    // await this.wait(5);
    // await this.wait(3, (_, t) => (this.sprite.alpha = 1.0 - t));
    // this.destroy();
  }

  onTick(dt: number) {
    this.position.iadd(this.velocity.mul(dt));
    this.velocity.imul(Math.exp(-LINEAR_FRICTION * dt));

    this.rotation += this.spin * dt;
    this.spin *= Math.exp(-ANGULAR_FRICTION * dt);

    if (this.z < 0) {
      this.z = 0;
      if (Math.abs(this.zVelocity) > MIN_BOUNCE_SPEED) {
        // bounce
        const sound = this.bounceSounds.getNext();
        const gain = clamp(Math.abs(this.zVelocity) / 15);
        this.game?.addEntity(
          new PositionalSound(sound, this.position, { gain })
        );
        this.zVelocity *= -BOUNCE_RESTITUTION;
        this.spin *= 0.5;
        this.velocity.imul(0.5);
      } else {
        // on ground
        this.zVelocity = 0;
        this.velocity.imul(Math.exp(-LINEAR_FRICTION * dt));
        this.spin *= Math.exp(-ANGULAR_FRICTION * dt);
      }
    } else {
      this.z += this.zVelocity * dt;
      this.zVelocity -= 9.8 * dt; // gravity
    }
  }

  onRender() {
    this.sprite.position.set(...this.position);
    this.sprite.rotation = this.rotation;

    const scale = 1 + this.z * 0.8;
    this.sprite.scale.set((SIZE / this.sprite.texture.width) * scale);
  }
}

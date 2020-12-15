import { Body, Box } from "p2";
import { Graphics } from "pixi.js";
import snd_elevatorDing from "../../../resources/audio/environment/elevator-ding.flac";
import snd_elevatorDoorClose from "../../../resources/audio/environment/elevator-door-close.flac";
import snd_elevatorDoorOpen from "../../../resources/audio/environment/elevator-door-open.flac";
import snd_wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import snd_wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { smoothStep } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layers } from "../layers";
import { CollisionGroups } from "../physics/CollisionGroups";
import SwingingWeapon from "../weapons/SwingingWeapon";
import Bullet from "./Bullet";
import Hittable from "./Hittable";
import Interactable from "./Interactable";

const OPEN_TIME = 1.9;
const CLOSE_TIME = 2.8;
const DING_TIME = 0.5;

/**
 * Represents one of the two doors representing an elevator door
 */
class HalfDoor extends BaseEntity implements Entity, Hittable {
  tags = ["cast_shadow"];
  staticCorner: V2d;
  oppositeCorner: V2d;
  dimensions: V2d;
  verticalMovement: boolean;
  sprite: Graphics;
  doorShape: Box;
  body: Body;

  constructor(
    staticCorner: V2d,
    oppositeCorner: V2d,
    verticalMovement: boolean
  ) {
    super();

    this.staticCorner = staticCorner;
    this.oppositeCorner = oppositeCorner;
    const startingDimensions = this.oppositeCorner.sub(this.staticCorner);
    this.dimensions = V(startingDimensions.x, startingDimensions.y);
    this.verticalMovement = verticalMovement;

    this.sprite = new Graphics();
    this.sprite.position.set(...staticCorner);
    (this.sprite as GameSprite).layerName = Layers.WORLD_FRONT;

    const shape = new Box({
      width: Math.abs(this.dimensions.x),
      height: Math.abs(this.dimensions.y),
    });
    shape.collisionGroup = CollisionGroups.World | CollisionGroups.CastsShadow;
    shape.collisionMask =
      CollisionGroups.All ^
      (CollisionGroups.World | CollisionGroups.CastsShadow);
    this.doorShape = shape;

    this.body = new Body({
      mass: 0,
    });
    this.body.type = Body.KINEMATIC;
    this.body.addShape(shape);

    this.setOpenPercentage(0);
  }

  setOpenPercentage(openPercentage: number) {
    const delta = V(
      this.dimensions.x * (this.verticalMovement ? 1 : 1 - openPercentage),
      this.dimensions.y * (this.verticalMovement ? 1 - openPercentage : 1)
    );

    this.sprite.clear();
    this.sprite.beginFill(0xff6666);
    this.sprite.drawRect(0, 0, delta.x, delta.y);
    this.sprite.endFill();

    this.body.position = this.staticCorner.add(delta.mul(0.5));
    this.doorShape.width = Math.abs(delta.x);
    this.doorShape.height = Math.abs(delta.y);
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d) {
    this.game!.addEntity(
      new PositionalSound(choose(snd_wallHit1, snd_wallHit2), position)
    );
  }
}

/**
 * A pair of elevator doors.  They must be axis aligned boxes.
 */
export default class ElevatorDoor extends BaseEntity implements Entity {
  openPerentage: number = 0;
  state: "STOPPED" | "OPENING" | "CLOSING" = "STOPPED";
  topDoor: HalfDoor;
  bottomDoor: HalfDoor;
  center: V2d;

  constructor(
    upperLeftCorner: V2d,
    dimensions: V2d,
    verticalMovement: boolean
  ) {
    super();

    this.center = upperLeftCorner.add(dimensions.mul(0.5));
    const [x, y] = this.center;
    const [w, h] = dimensions;

    if (verticalMovement) {
      this.topDoor = new HalfDoor(
        upperLeftCorner,
        upperLeftCorner.add(V(w, h / 2)),
        verticalMovement
      );
      this.bottomDoor = new HalfDoor(
        upperLeftCorner.add(V(0, h)),
        upperLeftCorner.add(V(w, h / 2)),
        verticalMovement
      );
    } else {
      this.topDoor = new HalfDoor(
        V(x - w / 2, y - h / 2),
        V(x, y + h / 2),
        verticalMovement
      );
      this.bottomDoor = new HalfDoor(
        V(x + w / 2, y - h / 2),
        V(x, y + h / 2),
        verticalMovement
      );
    }

    this.addChild(this.topDoor);
    this.addChild(this.bottomDoor);

    this.addChild(
      new Interactable(
        upperLeftCorner.add(dimensions.mul(0.5)),
        this.onInteract.bind(this)
      )
    );
  }

  async onInteract() {
    if (this.state === "STOPPED") {
      this.game?.addEntity(new PositionalSound(snd_elevatorDing, this.center));
      const isClosing = this.openPerentage === 1;
      this.state = isClosing ? "CLOSING" : "OPENING";
      await this.wait(DING_TIME);
      const sound = isClosing ? snd_elevatorDoorClose : snd_elevatorDoorOpen;
      this.game?.addEntity(new PositionalSound(sound, this.center));
      await this.wait(isClosing ? CLOSE_TIME : OPEN_TIME, (dt, t) => {
        this.openPerentage = smoothStep(isClosing ? 1 - t : t);
        this.topDoor.setOpenPercentage(this.openPerentage);
        this.bottomDoor.setOpenPercentage(this.openPerentage);
      });
      this.openPerentage = isClosing ? 0 : 1;
      this.topDoor.setOpenPercentage(this.openPerentage);
      this.bottomDoor.setOpenPercentage(this.openPerentage);
      this.state = "STOPPED";
    }
  }
}

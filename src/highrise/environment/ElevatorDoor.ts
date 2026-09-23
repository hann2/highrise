import { Graphics } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import type { Body } from "../../core/physics/body/Body";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { Box } from "../../core/physics/shapes/Box";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { smoothStep } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import Bullet from "../projectiles/Bullet";
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
  dimensions: V2d;
  sprite: Graphics & GameSprite;
  doorShape?: Box;
  body: Body;

  constructor(
    private staticCorner: V2d,
    oppositeCorner: V2d,
    private verticalMovement: boolean,
  ) {
    super();

    this.dimensions = oppositeCorner.sub(staticCorner);

    this.sprite = new Graphics();
    this.sprite.position.copyFrom(staticCorner);
    this.sprite.layerName = Layer.WORLD_FRONT;

    this.body = createRigid2D({ motion: "kinematic" });

    this.setOpenPercentage(0);
  }

  setOpenPercentage(openPercentage: number) {
    const delta = V(
      this.dimensions.x * (this.verticalMovement ? 1 : 1 - openPercentage),
      this.dimensions.y * (this.verticalMovement ? 1 - openPercentage : 1),
    );

    this.sprite.clear();
    this.sprite.rect(0, 0, delta.x, delta.y).fill(0xff6666);

    this.body.position.set(this.staticCorner.add(delta.mul(0.5)));
    this.setDoorShape(Math.abs(delta.x), Math.abs(delta.y));
  }

  /** Boxes can't be resized, so we make a new one whenever the door moves. */
  private setDoorShape(width: number, height: number) {
    if (this.doorShape) {
      this.body.removeShape(this.doorShape);
    }
    this.doorShape = new Box({
      width,
      height,
      collisionGroup: CollisionGroups.Walls | CollisionGroups.CastsShadow,
      collisionMask:
        CollisionGroups.All ^
        (CollisionGroups.Walls | CollisionGroups.CastsShadow),
    });
    this.body.addShape(this.doorShape);
  }

  hitByMelee() {}

  hitByBullet(bullet: Bullet, position: V2d) {
    this.game.addEntity(
      new PositionalSound(choose("wallHit1", "wallHit2"), position),
    );
    return true;
  }
}

/**
 * A pair of elevator doors.  They must be axis aligned boxes.
 */
export default class ElevatorDoor extends BaseEntity implements Entity {
  openPercentage: number = 0;
  state: "STOPPED" | "OPENING" | "CLOSING" = "STOPPED";
  topDoor: HalfDoor;
  bottomDoor: HalfDoor;
  center: V2d;

  constructor(
    upperLeftCorner: V2d,
    dimensions: V2d,
    verticalMovement: boolean,
    /** Whether E opens and closes it. Otherwise only `open`/`close` do. */
    interactable: boolean = true,
  ) {
    super();

    this.center = upperLeftCorner.add(dimensions.mul(0.5));
    const [x, y] = this.center;
    const [w, h] = dimensions;

    if (verticalMovement) {
      this.topDoor = new HalfDoor(
        upperLeftCorner,
        upperLeftCorner.add(V(w, h / 2)),
        verticalMovement,
      );
      this.bottomDoor = new HalfDoor(
        upperLeftCorner.add(V(0, h)),
        upperLeftCorner.add(V(w, h / 2)),
        verticalMovement,
      );
    } else {
      this.topDoor = new HalfDoor(
        V(x - w / 2, y - h / 2),
        V(x, y + h / 2),
        verticalMovement,
      );
      this.bottomDoor = new HalfDoor(
        V(x + w / 2, y - h / 2),
        V(x, y + h / 2),
        verticalMovement,
      );
    }

    this.addChildren(this.topDoor, this.bottomDoor);
    if (interactable) {
      this.addChild(
        new Interactable(this.center, this.handleInteract.bind(this)),
      );
    }
  }

  handleInteract() {
    return this.openPercentage === 1 ? this.close() : this.open();
  }

  /** Dings, then slides open. Resolves once it's all the way open. */
  open(): Promise<void> {
    return this.move(false);
  }

  /** Dings, then slides shut. Resolves once it's all the way shut. */
  close(): Promise<void> {
    return this.move(true);
  }

  private async move(isClosing: boolean) {
    if (
      this.state === "STOPPED" &&
      this.openPercentage !== (isClosing ? 0 : 1)
    ) {
      this.game.addEntity(new PositionalSound("elevatorDing", this.center));
      this.state = isClosing ? "CLOSING" : "OPENING";
      await this.wait(DING_TIME);
      const sound = isClosing ? "elevatorDoorClose" : "elevatorDoorOpen";
      this.game.addEntity(new PositionalSound(sound, this.center));
      await this.wait(isClosing ? CLOSE_TIME : OPEN_TIME, (dt, t) => {
        this.openPercentage = smoothStep(isClosing ? 1 - t : t);
        this.topDoor.setOpenPercentage(this.openPercentage);
        this.bottomDoor.setOpenPercentage(this.openPercentage);
      });
      this.openPercentage = isClosing ? 0 : 1;
      this.topDoor.setOpenPercentage(this.openPercentage);
      this.bottomDoor.setOpenPercentage(this.openPercentage);
      this.state = "STOPPED";
    }
  }
}

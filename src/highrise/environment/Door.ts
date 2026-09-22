import { Sprite } from "pixi.js";
import { ImageName } from "../../../resources/resources";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import type { Body } from "../../core/physics/body/Body";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { RevoluteConstraint } from "../../core/physics/constraints/RevoluteConstraint";
import { Box } from "../../core/physics/shapes/Box";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import WallImpact from "../effects/WallImpact";
import Bullet from "../projectiles/Bullet";
import DoorSpring from "../utils/DoorSpring";
import { DoorFrame } from "./DoorFrame";
import Hittable from "./Hittable";

const DOOR_THICKNESS = 0.25;

export const DEFAULT_DOOR_SPRITES: ImageName[] = ["door1"];

export default class Door extends BaseEntity implements Entity, Hittable {
  tags: string[];
  sprite: Sprite & GameSprite;
  body: Body;

  constructor(
    private hingePoint: V2d,
    length: number,
    private restingAngle: number,
    private minAngle: number,
    private maxAngle: number,
    blocksVision: boolean = true,
    imageName: ImageName = choose(...DEFAULT_DOOR_SPRITES),
  ) {
    super();

    this.sprite = Sprite.from(imageName);
    this.sprite.scale.set(length / this.sprite.width);
    this.sprite.anchor.set(0, 0.5); // door sprites are horizontal
    this.sprite.position.copyFrom(hingePoint);
    this.sprite.layerName = Layer.WORLD_FRONT;

    this.body = createRigid2D({
      motion: "dynamic",
      mass: 1.0,
      position: hingePoint,
      angle: restingAngle,
    });

    const shape = new Box({ width: DOOR_THICKNESS / 2, height: length });
    shape.collisionGroup = CollisionGroups.Walls;
    shape.collisionMask =
      CollisionGroups.All ^
      CollisionGroups.Walls ^
      CollisionGroups.Furniture ^
      CollisionGroups.CastsShadow;
    if (blocksVision) {
      shape.collisionGroup |= CollisionGroups.CastsShadow;
      this.tags = ["cast_shadow"];
    } else {
      shape.collisionMask ^= CollisionGroups.Projectiles;
      this.tags = [];
    }
    this.body.addShape(shape, [length / 2, 0], Math.PI / 2);

    this.addChild(new DoorFrame(hingePoint, restingAngle, length));
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    this.constraints = [
      new RevoluteConstraint(game.ground, this.body, {
        worldPivot: this.hingePoint,
      }),
    ];
    this.springs = [
      new DoorSpring(
        game.ground,
        this.body,
        this.restingAngle + this.minAngle,
        this.restingAngle + this.maxAngle,
      ),
    ];
  }

  @on("render")
  onRender() {
    this.sprite.rotation = this.body.angle;
  }

  hitByMelee() {}

  hitByBullet(bullet: Bullet, position: V2d, normal: V2d) {
    this.body.applyImpulse(
      bullet.velocity.mul(bullet.stats.mass * 0.5),
      position.sub(this.body.position),
    );

    this.game!.addEntities(
      new PositionalSound(choose("wallHit1", "wallHit2"), position),
      new WallImpact(position, normal),
    );

    return true;
  }
}

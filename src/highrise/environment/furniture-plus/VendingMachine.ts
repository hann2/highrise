import { Sprite } from "pixi.js";
import { ImageName, SoundName } from "../../../../resources/resources";
import { CollisionGroups } from "../../../config/CollisionGroups";
import { Layer } from "../../../config/layers";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite, loadGameSprite } from "../../../core/entity/GameSprite";
import { createRigid2D } from "../../../core/physics/body/bodyFactories";
import { Box } from "../../../core/physics/shapes/Box";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose, rInteger, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import WallImpact from "../../effects/WallImpact";
import Light from "../../lighting-and-vision/Light";
import Bullet from "../../projectiles/Bullet";
import SwingingWeapon from "../../weapons/melee/SwingingWeapon";
import Hittable from "../Hittable";
import Interactable from "../Interactable";

// [machine image, glow image]
export const VENDING_MACHINES: [ImageName, ImageName][] = [
  ["vendingMachine1", "vendingMachineGlow1"],
  ["vendingMachine2", "vendingMachineGlow2"],
  ["vendingMachine3", "vendingMachineGlow3"],
];

export const VENDING_MACHINE_HIT_SOUNDS: SoundName[] = [
  "vendingMachineHit1",
  "vendingMachineHit2",
];

export default class VendingMachine
  extends BaseEntity
  implements Entity, Hittable
{
  interactable?: Interactable;
  dead = false;
  sprite: Sprite & GameSprite;
  lightSprite: Sprite;
  light: Light;
  hp = rInteger(40, 60);

  constructor(position: V2d, rotation: number) {
    super();

    const [machineImage, glowImage] = choose(...VENDING_MACHINES);

    this.sprite = loadGameSprite(machineImage, Layer.WORLD);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.copyFrom(position);
    this.sprite.width = 1.5;
    this.sprite.height = 1.5;
    this.sprite.rotation = rotation;

    this.lightSprite = Sprite.from(glowImage);
    this.lightSprite.anchor.set(0.5, 0.5);
    this.lightSprite.blendMode = "normal";
    this.lightSprite.width = 1.5;
    this.lightSprite.height = 1.5;
    this.lightSprite.rotation = rotation;

    this.light = this.addChild(new Light(this.lightSprite, false, 2));
    this.light.setPosition(position);

    this.body = createRigid2D({
      motion: "static",
      position,
      angle: rotation,
    });
    this.body.addShape(
      new Box({
        width: 1.1,
        height: 0.9,
        position: [0, 0.3],
        collisionGroup: CollisionGroups.Walls,
        collisionMask: CollisionGroups.All,
      }),
    );

    this.interactable = this.addChild(
      new Interactable(
        position,
        () => {
          this.game.addEntity(new PositionalSound("quarterDrop1", position));
        },
        1.2,
      ),
    );
  }

  async die() {
    if (!this.dead) {
      this.dead = true;

      for (let i = 0; i < rInteger(2, 4); i++) {
        await this.wait(rUniform(0.04, 0.1), undefined, "flicker");
        this.lightSprite.alpha = 0;
        this.light.dirty = true;
        await this.wait(rUniform(0.04, 0.1), undefined, "flicker");
        this.lightSprite.alpha = 1;
        this.light.dirty = true;
      }

      await this.wait(0.2, (dt, t) => {
        this.lightSprite.alpha = 1 - t;
        this.light.dirty = true;
      });

      this.lightSprite.visible = false;

      this.interactable?.destroy();
      this.interactable = undefined;
    }
  }

  hitByMelee(swingingWeapon: SwingingWeapon, position: V2d): void {
    this.hp -= swingingWeapon.getDamage();

    this.game.addEntities(
      new PositionalSound(choose(...VENDING_MACHINE_HIT_SOUNDS), position),
      new WallImpact(position),
    );

    if (this.hp <= 0 && !this.dead) {
      this.die();
    }
  }

  hitByBullet(bullet: Bullet, position: V2d, normal: V2d) {
    this.hp -= bullet.damage;

    this.game.addEntities(
      new PositionalSound(choose(...VENDING_MACHINE_HIT_SOUNDS), position),
      new WallImpact(position, normal, 0x444444),
    );

    if (this.hp <= 0 && !this.dead) {
      this.die();
    }

    return true;
  }
}

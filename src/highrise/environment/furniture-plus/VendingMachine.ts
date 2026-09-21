import type { Body } from "../../../core/physics/body/Body";
import { Box } from "../../../core/physics/shapes/Box";
import { createRigid2D } from "../../../core/physics/body/bodyFactories";
import { SoundName } from "../../../../resources/resources";
import { BLEND_MODES, Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose, rInteger, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../../config/CollisionGroups";
import { Layer } from "../../../config/layers";
import WallImpact from "../../effects/WallImpact";
import Light from "../../lighting-and-vision/Light";
import Bullet from "../../projectiles/Bullet";
import SwingingWeapon from "../../weapons/melee/SwingingWeapon";
import Hittable from "../Hittable";
import Interactable from "../Interactable";

export const VENDING_MACHINES = [
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
  machineSprite: Sprite;
  lightSprite: Sprite;
  light: Light;
  hp = rInteger(40, 60);

  constructor(position: V2d, rotation: number) {
    super();

    const [spriteUrl, glowUrl] = choose(...VENDING_MACHINES);

    this.machineSprite = Sprite.from(spriteUrl);
    this.machineSprite.anchor.set(0.5, 0.5);
    this.machineSprite.position.set(...position);
    this.machineSprite.width = 1.5;
    this.machineSprite.height = 1.5;
    this.machineSprite.rotation = rotation;
    (this.machineSprite as GameSprite).layerName = Layer.WORLD;

    this.lightSprite = Sprite.from(glowUrl);
    this.lightSprite.anchor.set(0.5, 0.5);
    // this.lightSprite.position.set(...position);
    this.lightSprite.blendMode = "normal";
    this.lightSprite.width = 1.5;
    this.lightSprite.height = 1.5;
    this.lightSprite.rotation = rotation;

    this.light = new Light(this.lightSprite, false, 2);
    this.light.setPosition(position.add([0.25, 0.25])); // WTF, why?
    this.addChild(this.light);

    this.sprites = [this.machineSprite];

    this.body = createRigid2D({
      motion: "static",
      position: position.clone(),
      angle: rotation,
    });
    const shape = new Box({
      width: 1.1,
      height: 0.9,
    });
    shape.collisionGroup = CollisionGroups.Walls;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape, [0, 0.3]);

    this.interactable = this.addChild(
      new Interactable(
        position,
        () => {
          this.game?.addEntity(new PositionalSound("quarterDrop1", position));
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

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {
    this.hp -= swingingWeapon.getDamage();

    this.game!.addEntities(
      new PositionalSound(choose(...VENDING_MACHINE_HIT_SOUNDS), position),
      new WallImpact(position),
    );

    if (this.hp <= 0 && !this.dead) {
      this.die();
    }
  }

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.hp -= bullet.damage;

    this.game!.addEntities(
      new PositionalSound(choose(...VENDING_MACHINE_HIT_SOUNDS), position),
      new WallImpact(position, normal, 0x444444),
    );

    if (this.hp <= 0 && !this.dead) {
      this.die();
    }

    return true;
  }
}

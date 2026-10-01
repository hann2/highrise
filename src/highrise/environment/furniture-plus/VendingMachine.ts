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
import { polarToVec } from "../../../core/util/MathUtil";
import { V2d } from "../../../core/Vector";
import WallImpact from "../../effects/WallImpact";
import Light from "../../lighting-and-vision/Light";
import Bullet from "../../projectiles/Bullet";
import SwingingWeapon from "../../weapons/melee/SwingingWeapon";
import Human from "../../human/Human";
import { ConsumableStats } from "../../weapons/consumables/ConsumableStats";
import { FragGrenade } from "../../weapons/consumables/consumable-stats/FragGrenade";
import {
  AMMO_BOX,
  AMMO_PRICE,
  AmmoClass,
  ammoClassName,
} from "../../weapons/guns/ammo";
import Gun from "../../weapons/guns/Gun";
import AmmoPickup from "../AmmoPickup";
import ConsumablePickup from "../ConsumablePickup";
import HealthPickup from "../HealthPickup";
import Hittable from "../Hittable";
import Interactable from "../Interactable";
import { getPartyManager } from "../PartyManager";
import Quarter from "../Quarter";

/**
 * What a machine sells: health (snack), a box of rounds for the gun in hand
 * (ammo), or one throwable of a kind chosen when it's placed (grenade)
 */
export type VendingMachineKind = "snack" | "ammo" | "grenade";

/** Quarters for a snack (a health pickup) */
export const VENDING_MACHINE_PRICE = 3;
/** Quarters for a throwable from a grenade machine. Ammo prices are in `ammo.ts`. */
export const GRENADE_MACHINE_PRICE = 4;

/** Tints telling the kinds apart, until they have their own art */
const KIND_TINTS: Record<VendingMachineKind, number> = {
  snack: 0xffffff,
  ammo: 0x9ab8ff,
  grenade: 0xb4ff90,
};
const KIND_TITLES: Record<VendingMachineKind, string> = {
  snack: "Snack machine",
  ammo: "Ammo machine",
  grenade: "Grenade machine",
};
/** How many quarters spill out when a machine is broken */
const BROKEN_QUARTERS_MIN = 2;
const BROKEN_QUARTERS_MAX = 4;

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
  /** In the middle of dispensing something */
  private vending = false;

  constructor(
    position: V2d,
    rotation: number,
    readonly kind: VendingMachineKind = "snack",
    /** What a grenade machine sells */
    readonly grenade: ConsumableStats = FragGrenade,
  ) {
    super();

    const [machineImage, glowImage] = choose(...VENDING_MACHINES);

    this.sprite = loadGameSprite(machineImage, Layer.WORLD);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.copyFrom(position);
    this.sprite.width = 1.5;
    this.sprite.height = 1.5;
    this.sprite.rotation = rotation;
    this.sprite.tint = KIND_TINTS[kind];

    this.lightSprite = Sprite.from(glowImage);
    this.lightSprite.anchor.set(0.5, 0.5);
    this.lightSprite.blendMode = "normal";
    this.lightSprite.width = 1.5;
    this.lightSprite.height = 1.5;
    this.lightSprite.rotation = rotation;
    this.lightSprite.tint = KIND_TINTS[kind];

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
      new Interactable(position, (human) => this.buy(human), 1.2),
    );
    this.interactable.highlightRadius = 0.85;
    // Busy dispensing, or broken: pressing E wouldn't do anything
    this.interactable.canInteract = () => !this.dead && !this.vending;
    this.interactable.prompt = (human) => {
      const title = KIND_TITLES[this.kind];
      const price = this.priceFor(human);
      if (price === undefined) {
        return { title, hint: "nothing fits" };
      }
      const what = this.describe(human);
      if ((getPartyManager(this.game)?.quarters ?? 0) < price) {
        return { title, detail: what, hint: "not enough quarters" };
      }
      return {
        title,
        detail: [what, `${price} quarters`].filter(Boolean).join(" · "),
      };
    };
  }

  /** The class of ammo an ammo machine would sell `human`: for the gun in hand */
  private ammoClassFor(human: Human): AmmoClass | undefined {
    return human.weapon instanceof Gun
      ? human.weapon.stats.ammoClass
      : undefined;
  }

  /** What `human` would pay, or undefined if there's nothing for them */
  priceFor(human: Human): number | undefined {
    switch (this.kind) {
      case "snack":
        return VENDING_MACHINE_PRICE;
      case "grenade":
        return GRENADE_MACHINE_PRICE;
      case "ammo": {
        const ammoClass = this.ammoClassFor(human);
        return ammoClass && AMMO_PRICE[ammoClass];
      }
    }
  }

  /** What it would sell `human`, for the prompt */
  private describe(human: Human): string | undefined {
    switch (this.kind) {
      case "snack":
        return undefined;
      case "grenade":
        return this.grenade.name;
      case "ammo": {
        const ammoClass = this.ammoClassFor(human)!;
        return `${AMMO_BOX[ammoClass]} ${ammoClassName(ammoClass).toLowerCase()} rounds`;
      }
    }
  }

  /** A point on the floor just in front of the machine, where things come out */
  getFrontPosition(distance = 0.8): V2d {
    // The front of the machine faces its local -y
    const front = polarToVec(this.sprite.rotation - Math.PI / 2, distance);
    return this.getPosition().add(front);
  }

  /** Dispenses something if there's something for `human` and the party can pay for it */
  buy(human: Human) {
    if (this.dead || this.vending) {
      return;
    }
    const partyManager = getPartyManager(this.game);
    const price = this.priceFor(human);
    if (price !== undefined && partyManager?.spendQuarters(price)) {
      this.dispense(this.makeGoods(human), price);
    } else {
      // Not enough money
      this.game.addEntity(
        new PositionalSound("vendingMachineHit1", this.getPosition(), {
          gain: 0.4,
          speed: 0.8,
        }),
      );
    }
  }

  /** What comes out, decided when it's paid for: `at` is where it lands */
  private makeGoods(human: Human): (at: V2d) => Entity {
    switch (this.kind) {
      case "snack":
        return (at) => new HealthPickup(at);
      case "grenade":
        return (at) => new ConsumablePickup(at, this.grenade, 1);
      case "ammo": {
        const ammoClass = this.ammoClassFor(human)!;
        return (at) => new AmmoPickup(at, ammoClass);
      }
    }
  }

  async dispense(makeGoods: (at: V2d) => Entity, price: number) {
    this.vending = true;
    for (let i = 0; i < price; i++) {
      this.game.addEntity(
        new PositionalSound("quarterDrop1", this.getPosition(), {
          speed: rUniform(0.95, 1.1),
        }),
      );
      await this.wait(0.12);
    }
    await this.flicker(rInteger(1, 2));
    this.game.addEntity(makeGoods(this.getFrontPosition()));
    this.vending = false;
  }

  async flicker(times: number) {
    for (let i = 0; i < times; i++) {
      await this.wait(rUniform(0.04, 0.1), undefined, "flicker");
      this.lightSprite.alpha = 0;
      await this.wait(rUniform(0.04, 0.1), undefined, "flicker");
      this.lightSprite.alpha = 1;
    }
  }

  /** Breaking a machine open spills the coin box */
  spillQuarters() {
    const count = rInteger(BROKEN_QUARTERS_MIN, BROKEN_QUARTERS_MAX);
    for (let i = 0; i < count; i++) {
      const offset = polarToVec(
        this.sprite.rotation - Math.PI / 2 + rUniform(-1, 1),
        rUniform(0.1, 0.35),
      );
      this.game.addEntity(
        new Quarter(this.getFrontPosition(0.55).iadd(offset), i === 0),
      );
    }
  }

  async die() {
    if (!this.dead) {
      this.dead = true;

      // Not straight away: melee hits land in the middle of a physics step
      await this.wait();
      this.spillQuarters();

      await this.flicker(rInteger(2, 4));

      await this.wait(0.2, (dt, t) => {
        this.lightSprite.alpha = 1 - t;
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

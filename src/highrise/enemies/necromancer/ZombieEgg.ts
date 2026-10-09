import { Container, Sprite } from "pixi.js";
import { ImageName } from "../../../../resources/resources";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";
import { on } from "../../../core/entity/handler";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { darken } from "../../../core/util/ColorUtils";
import { lerp, smoothStep } from "../../../core/util/MathUtil";
import { rDirection, rInteger, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../../config/CollisionGroups";
import { ZOMBIE_RADIUS } from "../../constants/constants";
import { getSplatSound } from "../../effects/Splat";
import type { BaseEnemy } from "../base/Enemy";
import Crawler from "../crawler/Crawler";
import Zombie from "../zombie/Zombie";
import { ZOMBIE_VARIANTS } from "../zombie/ZombieVariants";

const SIZE = 0.3;
const SPEED = 15; // meters per second

/**
 * Thrown by the Necromancer: flies to `target` (or lands short of the first
 * wall in the way) and hatches into a zombie or a crawler. The Necromancer's
 * children, so they go with it when it dies.
 */
export class ZombieEgg extends BaseEntity implements Entity {
  tickLayer = "enemies" as const;
  sprite: Container & GameSprite;
  eggSprite: Sprite;
  variant: number;

  constructor(
    public startPosition: V2d,
    public target: V2d,
    public spawnType: "zombie" | "crawler",
    /** Told about what hatches, once it's in the game */
    private onHatch?: (creature: BaseEnemy) => void,
  ) {
    super();

    this.sprite = new Container();
    this.sprite.rotation = rDirection();

    this.eggSprite = Sprite.from("blob4");
    this.eggSprite.scale.set(SIZE / this.eggSprite.texture.width);
    this.eggSprite.anchor.set(0.5);
    this.eggSprite.tint = darken(0x449922, rUniform(0.1, 0.5));

    this.sprite.addChild(this.eggSprite);

    this.variant = rInteger(0, 1000);
  }

  @on("add")
  async onAdd() {
    const hit = this.game.world.raycast(this.startPosition, this.target, {
      collisionMask: CollisionGroups.Walls,
    });
    if (hit) {
      const along = this.target.sub(this.startPosition).inormalize();
      this.target = V(hit.point).isub(along.imul(ZOMBIE_RADIUS * 1.5));
    }
    const distance = this.target.distanceTo(this.startPosition);
    const flightTime = 0.2 + distance / SPEED;
    await this.wait(
      flightTime,
      (dt, t) => {
        this.sprite.position.copyFrom(
          this.startPosition.lerp(this.target, smoothStep(t)),
        );
        const heightScale = 1.0 + Math.sin(t * Math.PI);
        this.sprite.scale.set(heightScale);
      },
      "flying",
    );
    this.land();
  }

  makeCreatureSprite(): Sprite {
    switch (this.spawnType) {
      case "zombie": {
        const choices: ImageName[] = ["zombie1", "zombie2", "zombie3"];
        return Sprite.from(choices[this.variant % choices.length]);
      }
      case "crawler": {
        const choices: ImageName[] = ["crawler1", "crawler2", "crawler3"];
        return Sprite.from(choices[this.variant % choices.length]);
      }
    }
  }

  makeCreature(position: V2d) {
    switch (this.spawnType) {
      case "zombie":
        return new Zombie(
          position,
          ZOMBIE_VARIANTS[this.variant % ZOMBIE_VARIANTS.length],
        );
      case "crawler":
        return new Crawler(
          position,
          0,
          ZOMBIE_VARIANTS[this.variant % ZOMBIE_VARIANTS.length].body.lying,
        );
    }
  }

  async land() {
    this.clearTimers("flying");
    this.sprite.scale.set(1);

    const position = V(this.sprite.x, this.sprite.y);

    this.game.addEntity(new PositionalSound(getSplatSound(), position));

    const creatureSprite = this.makeCreatureSprite();
    creatureSprite.anchor.set(0.5);
    this.sprite.addChild(creatureSprite);

    await this.wait(0.5, (dt, t) => {
      const fullCreatureSize =
        (2 * ZOMBIE_RADIUS) / creatureSprite.texture.width;
      creatureSprite.scale.set(
        lerp(0.5 * fullCreatureSize, fullCreatureSize, smoothStep(t)),
      );

      creatureSprite.alpha = smoothStep(t);
      this.eggSprite.alpha = smoothStep(1 - t);

      const fullEggSize = SIZE / this.eggSprite.texture.width;
      this.eggSprite.scale.set(fullEggSize * (1.0 + 2.0 * t));
    });

    const creature = this.makeCreature(position);
    creature.body.angle = this.sprite.rotation;
    this.game.addEntity(creature);
    this.onHatch?.(creature);

    this.destroy();
  }
}

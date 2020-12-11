import { Body, Box } from "p2";
import { BLEND_MODES, Sprite } from "pixi.js";
import wallHit1 from "../../../../resources/audio/impacts/wall-hit-1.flac";
import wallHit2 from "../../../../resources/audio/impacts/wall-hit-2.flac";
import quarterDrop1 from "../../../../resources/audio/misc/quarter-drop-1.flac";
import vendingMachineGlow from "../../../../resources/images/environment/vending-machine-glow.png";
import vendingMachine from "../../../../resources/images/environment/vending-machine.png";
import solidCircle from "../../../../resources/images/solid-circle.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import WallImpact from "../../effects/WallImpact";
import Light from "../../lighting/Light";
import { CollisionGroups } from "../../physics/CollisionGroups";
import SwingingWeapon from "../../weapons/SwingingWeapon";
import Bullet from "../Bullet";
import Hittable from "../Hittable";
import Interactable from "../Interactable";

export default class VendingMachine
  extends BaseEntity
  implements Entity, Hittable {
  sprite: Sprite & GameSprite;
  light?: Light;

  constructor(position: V2d, rotation: number) {
    super();

    this.sprite = Sprite.from(vendingMachine);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(...position);
    this.sprite.width = 1.5;
    this.sprite.height = 1.5;
    this.sprite.rotation = rotation;

    const dot = Sprite.from(solidCircle);
    dot.anchor.set(0.5, 0.5);
    dot.scale.set(2);
    this.sprite.addChild(dot);

    const lightSprite = Sprite.from(vendingMachineGlow);
    lightSprite.anchor.set(0.5, 0.5);
    lightSprite.blendMode = BLEND_MODES.ADD;
    lightSprite.width = 1.5;
    lightSprite.height = 1.5;
    lightSprite.rotation = rotation;

    this.light = this.addChild(new Light(lightSprite, false));
    this.light.getShadowRadius = () => 1.5;
    this.light.setPosition(position.add([0.25, 0.25])); // TODO: WHYY?!?!

    this.body = new Body({
      position: position.clone(),
      angle: rotation,
    });
    const shape = new Box({
      width: 1.1,
      height: 0.9,
    });
    shape.collisionGroup = CollisionGroups.World;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape, [0, 0.3]);

    this.addChild(
      new Interactable(
        position,
        () => {
          this.game?.addEntity(new PositionalSound(quarterDrop1, position));
        },
        1.2
      )
    );
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.game!.addEntities([
      new PositionalSound(choose(wallHit1, wallHit2), position),
      new WallImpact(position, normal),
    ]);
  }
}

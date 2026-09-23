import { Container, Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { rDirection, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";
import { AMMO_PICKUP_AMOUNT, LimitedAmmoClass } from "../weapons/guns/ammo";
import Interactable from "./Interactable";

const BOX_SIZE: [number, number] = [0.34, 0.24]; // meters

const BOX_COLORS: Record<LimitedAmmoClass, { box: number; round: number }> = {
  rifle: { box: 0x4f5a2e, round: 0xd9b24a },
  shotgun: { box: 0x8c2a22, round: 0xe0c060 },
};

/** A box of rifle or shotgun rounds. Interact to add them to your reserve. */
export default class AmmoPickup extends BaseEntity implements Entity {
  sprites: (Container & GameSprite)[];
  private box: Graphics & GameSprite;

  constructor(
    private position: V2d,
    public ammoClass: LimitedAmmoClass,
    public amount: number = AMMO_PICKUP_AMOUNT[ammoClass],
    private dropped = false,
  ) {
    super();

    this.addChild(new Interactable(position, this.handleInteract.bind(this)));

    this.box = drawAmmoBox(ammoClass);
    this.box.layerName = Layer.ITEMS;
    this.box.position.copyFrom(position);
    this.box.rotation = rDirection();

    // A faint glow so a box catches the eye in a dark room
    const glint: Graphics & GameSprite = new Graphics();
    glint.layerName = Layer.EMISSIVES;
    glint
      .roundRect(-0.25, -0.2, 0.5, 0.4, 0.1)
      .fill({ color: BOX_COLORS[ammoClass].round, alpha: 0.12 });
    glint.position.copyFrom(position);
    glint.rotation = this.box.rotation;

    this.sprites = [this.box, glint];
  }

  getPosition() {
    return this.position;
  }

  @on("add")
  onAdd() {
    if (this.dropped) {
      this.game.addEntity(
        new PositionalSound("shotgunCasingDrop1", this.position, {
          gain: 0.6,
          speed: rUniform(0.7, 0.8),
        }),
      );
    }
  }

  handleInteract(human: Human) {
    if (this.isDestroyed) {
      return;
    }
    const added = human.addReserve(this.ammoClass, this.amount);
    if (added <= 0) {
      return; // Full up; leave it for later
    }
    this.amount -= added;
    this.game.addEntity(new PositionalSound("magazineLoad1", this.position));
    if (this.amount <= 0) {
      this.destroy();
    }
  }
}

/** A cardboard box of rounds, seen from above */
function drawAmmoBox(ammoClass: LimitedAmmoClass): Graphics & GameSprite {
  const [w, h] = BOX_SIZE;
  const colors = BOX_COLORS[ammoClass];
  const graphics = new Graphics();
  graphics
    .rect(-w / 2, -h / 2, w, h)
    .fill(colors.box)
    .stroke({ width: 0.015, color: 0x000000, alpha: 0.5 })
    // Open lid showing the rounds
    .rect(-w / 2 + 0.03, -h / 2 + 0.03, w - 0.06, h - 0.06)
    .fill(0x201a10);
  const rows = 3;
  const columns = ammoClass === "shotgun" ? 4 : 6;
  const roundRadius = ammoClass === "shotgun" ? 0.024 : 0.014;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = -w / 2 + 0.03 + ((column + 0.5) * (w - 0.06)) / columns;
      const y = -h / 2 + 0.03 + ((row + 0.5) * (h - 0.06)) / rows;
      graphics.circle(x, y, roundRadius).fill(colors.round);
    }
  }
  return graphics;
}

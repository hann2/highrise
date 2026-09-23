import { Container, Graphics } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { Circle } from "../../core/physics/shapes/Circle";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { rDirection, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";
import { getPartyManager } from "./PartyManager";

/** Bigger than a real quarter so it can be seen from a top-down camera */
const QUARTER_RADIUS = 0.1; // meters
/** How close a party member has to walk to pick it up */
const PICKUP_RADIUS = 0.35; // meters
const POP_TIME = 0.25; // seconds

/** A quarter lying on the floor. Any party member walking over it collects it. */
export default class Quarter extends BaseEntity implements Entity {
  sprites: (Container & GameSprite)[];
  private coin: Graphics & GameSprite;
  private glint: Graphics & GameSprite;
  private collected = false;

  constructor(
    private position: V2d,
    private playDropSound = true,
  ) {
    super();

    this.coin = new Graphics();
    this.coin.layerName = Layer.ITEMS;
    this.coin
      .circle(0, 0, QUARTER_RADIUS)
      .fill(0xc9a93b)
      .circle(0, 0, QUARTER_RADIUS * 0.75)
      .stroke({ width: QUARTER_RADIUS * 0.12, color: 0x9c7f22 })
      // The shine
      .circle(
        -QUARTER_RADIUS * 0.35,
        -QUARTER_RADIUS * 0.35,
        QUARTER_RADIUS * 0.3,
      )
      .fill({ color: 0xfff4c0, alpha: 0.8 });
    this.coin.position.copyFrom(position);
    this.coin.rotation = rDirection();

    // A faint glow so a coin catches the eye in a dark room
    this.glint = new Graphics();
    this.glint.layerName = Layer.EMISSIVES;
    this.glint
      .circle(0, 0, QUARTER_RADIUS * 1.6)
      .fill({ color: 0xffe080, alpha: 0.12 })
      .circle(0, 0, QUARTER_RADIUS)
      .fill({ color: 0xffe080, alpha: 0.15 });
    this.glint.position.copyFrom(position);

    this.sprites = [this.coin, this.glint];

    this.body = createRigid2D({
      motion: "static",
      position,
      collisionResponse: false,
    });
    this.body.addShape(
      new Circle({
        radius: PICKUP_RADIUS,
        collisionGroup: CollisionGroups.Sensors,
        collisionMask: CollisionGroups.Humans,
      }),
    );
  }

  getPosition() {
    return this.position;
  }

  @on("add")
  async onAdd() {
    if (this.playDropSound) {
      this.game.addEntity(
        new PositionalSound("quarterDrop1", this.position, {
          gain: 0.5,
          speed: rUniform(0.9, 1.1),
        }),
      );
    }
    // Pops out a little bigger and settles
    await this.wait(POP_TIME, (_, t) => {
      const scale = 1 + 0.6 * Math.sin(Math.PI * t);
      this.coin.scale.set(scale);
      this.glint.scale.set(scale);
    });
    this.coin.scale.set(1);
    this.glint.scale.set(1);
  }

  @on("beginContact")
  onBeginContact({ other }: { other?: Entity }) {
    const partyManager = getPartyManager(this.game);
    if (
      !this.collected &&
      other instanceof Human &&
      partyManager?.hasMember(other)
    ) {
      this.collected = true;
      partyManager.addQuarters(1);
      this.game.addEntity(
        new PositionalSound("quarterDrop1", this.position, {
          speed: rUniform(1.5, 1.7),
        }),
      );
      this.destroy();
    }
  }
}

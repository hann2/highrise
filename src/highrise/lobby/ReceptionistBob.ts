import { CollisionGroups } from "../../config/CollisionGroups";
import { on } from "../../core/entity/handler";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { Circle } from "../../core/physics/shapes/Circle";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { angleDelta, clamp, degToRad } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { PERRY_ZOMBIE_SOUNDS } from "../constants/constants";
import { BodySprite } from "../creature-stuff/BodySprite";
import { HEAVY_RADIUS } from "../enemies/heavy/Heavy";
import Interactable from "../environment/Interactable";
import Human from "../human/Human";
import { BodyLook, resolveLook } from "../looks/BodyLook";
import { getAppearance } from "../looks/bakeBodies";

/** Shirt, tie, name badge, and only a little dead */
export const BOB_LOOK: BodyLook = resolveLook({
  skin: "#e0b48f",
  build: { shoulders: 0.3, chest: 0.3, belly: 1, hunch: 0.4, arms: 0.4, hands: 0.3, head: 0.1 },
  hair: { color: "#6b5a4a", coverage: 0.55, volume: 0.05, messiness: 0.2, fringe: 1 },
  glasses: { shape: "square", color: "#2a2a2a" },
  top: { style: "shirt", color: "#c4d6e8", secondary: "#ffffff" },
  sleeves: { length: 0.4 },
  extras: [
    { kind: "tie", color: "#7a1f2b" },
    { kind: "lanyard", color: "#2a5aa8" },
  ],
  pants: "#45484f",
  shoes: "#2a2420",
  zombie: { rot: 0.6, blood: 0, tears: 0 },
  seed: 1000,
});

/** How close the player has to be for Bob to look at them */
const NOTICE_DISTANCE = 5;
const TURN_SPEED = 2; // radians per second
const FACING_DOWN = Math.PI / 2;
const SWAY_AMOUNT = degToRad(4);

/**
 * Hello, my name is Bob, the wifi password is BRAIINNNNSS! A heavy behind the
 * reception desk who never leaves it and never attacks: he just watches you
 * and groans when you talk to him. Not an enemy, so the lobby stays safe.
 */
export default class ReceptionistBob extends BodySprite {
  private angle = FACING_DOWN;
  private swayPhase = 0;

  constructor(
    private position: V2d,
    private getPlayer: () => Human | undefined,
  ) {
    super(getAppearance(BOB_LOOK).standing, HEAVY_RADIUS);

    this.body = createRigid2D({ motion: "static", position });
    this.body.addShape(
      new Circle({
        radius: HEAVY_RADIUS,
        collisionGroup: CollisionGroups.Furniture,
        collisionMask: CollisionGroups.All,
      }),
    );

    const interactable = this.addChild(
      new Interactable(position, () => this.groan(), 2.5),
    );
    interactable.prompt = () => ({ title: "Bob", hint: "Reception" });
  }

  groan() {
    this.game.addEntity(
      new PositionalSound(choose(...PERRY_ZOMBIE_SOUNDS.idle), this.position),
    );
  }

  @on("tick")
  onTick(dt: number) {
    this.swayPhase += dt;
    const player = this.getPlayer();
    const toPlayer = player?.getPosition().sub(this.position);
    const target =
      toPlayer && toPlayer.magnitude < NOTICE_DISTANCE
        ? toPlayer.angle
        : FACING_DOWN;
    const turn = TURN_SPEED * dt;
    this.angle += clamp(angleDelta(this.angle, target), -turn, turn);
  }

  getPosition() {
    return this.position;
  }

  getAngle() {
    return this.angle;
  }

  getStanceAngle() {
    return Math.sin(this.swayPhase * 0.8) * SWAY_AMOUNT;
  }
}

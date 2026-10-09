import { CollisionGroups } from "../../../config/CollisionGroups";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { polarToVec } from "../../../core/util/MathUtil";
import { choose, rInteger, rUniform } from "../../../core/util/Random";
import { HUMAN_RADIUS } from "../../constants/constants";
import { getPartyLeader } from "../../environment/PartyManager";
import Human, { isHuman } from "../../human/Human";
import { testLineOfSight } from "../../utils/visionUtils";
import type Behemoth from "./Behemoth";
import { BEHEMOTH_RADIUS, SLAM_RANGE } from "./Behemoth";

/** Seconds between charges */
const CHARGE_EVERY: [number, number] = [5, 8];
/** It only charges from further away than this (meters) */
const CHARGE_MIN_DISTANCE = 4;
/** Seconds lining up: it follows its target for most of it, then commits */
const WINDUP = 0.9;
const WINDUP_TRACKING = 0.65;
const CHARGE_SPEED = 13;
const CHARGE_ACCELERATION = 25;
const CHARGE_TIME = 1.6;
const CHARGE_DAMAGE: [number, number] = [40, 55];
/** Seconds dazed after running into a wall */
const DAZED = 2.5;

type State = "chase" | "windup" | "charge";

/**
 * What the Behemoth does: walks at the leader and slams them when they're
 * close; every few seconds, if it can see them from far enough away, stops,
 * lines up and charges in a straight line. A charge hits everyone in its path
 * once, and ends when it runs out or runs into a wall, which dazes it.
 */
export default class BehemothController extends BaseEntity implements Entity {
  state: State = "chase";
  private stateTime = 0;
  private untilCharge = rUniform(...CHARGE_EVERY);
  private chargeAngle = 0;
  /** Who the charge has hit already */
  private hit = new Set<Human>();
  private readonly walkSpeed: number;
  private readonly walkAcceleration: number;

  constructor(private behemoth: Behemoth) {
    super();
    this.walkSpeed = behemoth.walkSpring.speed;
    this.walkAcceleration = behemoth.walkSpring.acceleration;
  }

  /** Lines up a charge right away (for the boss test panel) */
  chargeNow() {
    this.untilCharge = 0;
    if (this.state === "chase") {
      this.startWindup();
    }
  }

  @on("tick")
  onTick(dt: number) {
    const behemoth = this.behemoth;
    const target = getPartyLeader(this.game);
    this.stateTime += dt;

    if (behemoth.isStunned) {
      behemoth.walkSpring.stop();
      return;
    }
    if (!target || target.isDestroyed) {
      behemoth.walkSpring.stop();
      return;
    }
    const toTarget = target.getPosition().sub(behemoth.getPosition());

    switch (this.state) {
      case "chase": {
        behemoth.setTargetDirection(toTarget.angle);
        this.untilCharge -= dt;
        const attacking = behemoth.getAttackPhase() !== "ready";
        if (toTarget.magnitude < SLAM_RANGE) {
          behemoth.walkSpring.stop();
          behemoth.attack();
        } else if (attacking) {
          behemoth.walkSpring.stop();
        } else if (
          this.untilCharge <= 0 &&
          toTarget.magnitude > CHARGE_MIN_DISTANCE &&
          testLineOfSight(behemoth, target)
        ) {
          this.startWindup();
        } else {
          behemoth.walkSpring.walkTowards(toTarget.angle, 1);
        }
        break;
      }
      case "windup": {
        behemoth.walkSpring.stop();
        if (this.stateTime < WINDUP_TRACKING) {
          this.chargeAngle = toTarget.angle;
          behemoth.setTargetDirection(this.chargeAngle);
        }
        if (this.stateTime >= WINDUP) {
          this.startCharge();
        }
        break;
      }
      case "charge": {
        behemoth.walkSpring.walkTowards(this.chargeAngle, 1);
        this.hitWhoeverIsInTheWay();
        if (this.runningIntoWall()) {
          this.crash();
        } else if (this.stateTime >= CHARGE_TIME) {
          this.endCharge();
        }
        break;
      }
    }
  }

  private setState(state: State) {
    this.state = state;
    this.stateTime = 0;
  }

  private startWindup() {
    this.setState("windup");
    this.behemoth.voice.speak("targetAquired");
  }

  private startCharge() {
    this.setState("charge");
    this.hit.clear();
    this.behemoth.walkSpring.speed = CHARGE_SPEED;
    this.behemoth.walkSpring.acceleration = CHARGE_ACCELERATION;
    this.behemoth.voice.speak("attack");
  }

  private endCharge() {
    this.behemoth.walkSpring.speed = this.walkSpeed;
    this.behemoth.walkSpring.acceleration = this.walkAcceleration;
    this.untilCharge = rUniform(...CHARGE_EVERY);
    this.setState("chase");
  }

  /** Ran into a wall: a thud, and dazed for a while */
  private crash() {
    this.endCharge();
    this.behemoth.body.velocity.set(0, 0);
    this.behemoth.daze(DAZED);
    const sound = choose("wallHit1", "wallHit2", "wallHit3", "wallHit4");
    this.game.addEntity(
      new PositionalSound(sound, this.behemoth.getPosition(), { speed: 0.5 }),
    );
  }

  private hitWhoeverIsInTheWay() {
    const position = this.behemoth.getPosition();
    for (const human of this.game.entities.getByFilter(isHuman)) {
      if (this.hit.has(human) || human.isDestroyed) {
        continue;
      }
      const reach = BEHEMOTH_RADIUS + HUMAN_RADIUS + 0.2;
      if (human.getPosition().distanceTo(position) < reach) {
        this.hit.add(human);
        this.behemoth.hit(human, rInteger(...CHARGE_DAMAGE));
      }
    }
  }

  /** Whether there's a wall right in front of it, once it's got going */
  private runningIntoWall(): boolean {
    if (this.stateTime < 0.15) {
      return false;
    }
    const from = this.behemoth.getPosition();
    const to = from.add(polarToVec(this.chargeAngle, BEHEMOTH_RADIUS + 0.25));
    return !!this.game.world.raycast(from, to, {
      collisionMask: CollisionGroups.Walls,
    });
  }
}

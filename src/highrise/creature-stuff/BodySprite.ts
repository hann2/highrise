import { Container, Sprite } from "pixi.js";
import { BodyTextures, bodyPixelScale } from "../looks/bakeBodies";
import { BodyLayer } from "../looks/drawBody";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { FootLanding, Gait, SIDES } from "../../core/animation/Gait";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { HUMAN_RADIUS } from "../constants/constants";
import { elbowPosition } from "./armReach";
import { STYLE } from "../looks/style";
import { FOOT_FORWARD, HEM_OVERLAP, HIP_WIDTH, LegStyle } from "./Legs";
import FloorStains, { getFloorStains } from "../effects/FloorStains";
import { Shoes } from "./Shoes";
import { Dangles } from "./Dangles";

export type { BodyTextures } from "../looks/bakeBodies";

/**
 * How far (meters) beyond the edge of the view a body is still posed and
 * drawn, so nothing shows up unposed at the edge
 */
const VIEW_MARGIN = 1;

/** How much bigger a foot looks at the top of its swing, nearer the camera */
const FOOT_LIFT_SCALE = 0.15;
/** Radians the shoulders turn against the hips with each step, at full stride */
const TORSO_TWIST = 0.06;

// A body with arms that faces a direction
export abstract class BodySprite extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  torsoSprite: Sprite;
  headSprite: Sprite;
  /** Each arm's upper arm and forearm */
  leftArmSprite: Container;
  armThickness: number;
  /** From the middle to each shoulder joint, in meters */
  private shoulderOffset: number;
  private headRadius: number;
  rightArmSprite: Container;
  private armSegments: [Sprite, Sprite][];
  leftHandSprite: Sprite;
  rightHandSprite: Sprite;
  /** The legs and feet, under everything else; only for a body with `legs` */
  legsSprite?: Container;
  /** Just the legs, hidden when the body covers them; the feet always show */
  private legsOnly?: Container;
  private legSprites: Sprite[] = [];
  private footSprites: Sprite[] = [];
  /** How the legs walk, worked out from how the body moves; only for a body with `legs` */
  readonly gait?: Gait;
  /** What's on its soles, which it leaves in prints; only for a body with `legs` */
  readonly shoes?: Shoes;
  /** Called as each foot comes down, after the shoes have had their say (for anything else that wants to know) */
  onFootLand?: (landing: FootLanding) => void;
  /** `game.simulatedTime` when the gait was last moved on */
  private gaitTime = 0;
  /** What swings as it moves (a ponytail, a lanyard...); only for a body that has any */
  readonly dangles?: Dangles;
  /** `game.simulatedTime` when the dangles were last moved on */
  private dangleTime = 0;
  /** How big the legs are next to a human's */
  private legScale: number;
  /** Meters per texture pixel */
  private pixelScale: number;
  private legThickness = 0;
  /** From shoulder to elbow, and elbow to the middle of the hand (m) */
  private upperArm: number;
  private forearm: number;

  constructor(
    readonly textures: BodyTextures,
    private radius: number,
    legs?: LegStyle,
  ) {
    super();

    this.sprite = new Container();
    this.legScale = radius / HUMAN_RADIUS;

    // Each part's texture is anchored where it attaches, and drawn at a
    // fixed number of pixels per meter, bigger or smaller with the body
    const scale = bodyPixelScale(this.legScale);
    this.pixelScale = scale;
    const { metrics } = textures;
    this.armThickness = metrics.armThickness * this.legScale;
    this.shoulderOffset = metrics.shoulderOffset * this.legScale;
    this.headRadius = metrics.headRadius * this.legScale;

    this.torsoSprite = new Sprite(textures.torso);
    this.torsoSprite.scale.set(scale);

    this.headSprite = new Sprite(textures.head);
    this.headSprite.scale.set(scale);

    // Each arm in two, bent at the elbow (see `poseArms`)
    this.armSegments = [
      [textures.leftUpperArm, textures.leftForearm],
      [textures.rightUpperArm, textures.rightForearm],
    ].map(
      (pair) =>
        pair.map((texture) => {
          const sprite = new Sprite(texture);
          sprite.scale.set(scale);
          return sprite;
        }) as [Sprite, Sprite],
    );
    this.leftArmSprite = new Container();
    this.leftArmSprite.addChild(...this.armSegments[0]);
    this.rightArmSprite = new Container();
    this.rightArmSprite.addChild(...this.armSegments[1]);
    this.upperArm = metrics.upperArm * this.legScale;
    this.forearm = metrics.forearm * this.legScale;

    this.leftHandSprite = new Sprite(textures.leftHand);
    this.leftHandSprite.scale.set(scale);
    this.rightHandSprite = new Sprite(textures.rightHand);
    this.rightHandSprite.scale.set(scale);

    // What swings goes over the torso and under the head, but a bun on top
    const dangles =
      textures.dangles.length > 0
        ? new Dangles(textures.dangles, scale, this.legScale)
        : undefined;
    this.dangles = dangles;
    this.sprite.addChild(
      this.leftArmSprite,
      this.rightArmSprite,
      this.leftHandSprite,
      this.rightHandSprite,
      this.torsoSprite,
      ...(dangles?.sprites("torso") ?? []),
      ...(dangles?.sprites("head") ?? []),
      this.headSprite,
      ...(dangles?.sprites("head", true) ?? []),
    );

    if (legs) {
      this.gait = new Gait(legs.gait, HIP_WIDTH * this.legScale);
      const shoes = new Shoes(this.legScale);
      this.shoes = shoes;
      this.gait.onLand = (landing) => {
        shoes.land(
          landing,
          this.game.entities.getById("floorStains") as FloorStains | undefined,
          () => getFloorStains(this.game),
        );
        this.dangles?.step(landing.side, this.getAngle(), landing.speed);
        this.onFootLand?.(landing);
      };
      const { leg, leftFoot, rightFoot, thickness } = legs.textures;
      this.legThickness = thickness * this.legScale;
      this.legSprites = [leg, leg].map((texture) => {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.scale.set(scale);
        return sprite;
      });
      // Sides are in the gait's order: left, then right
      this.footSprites = [leftFoot, rightFoot].map(
        (texture) => new Sprite(texture),
      );
      this.legsOnly = new Container();
      this.legsOnly.addChild(...this.legSprites);
      this.legsSprite = new Container();
      // Feet under the legs, so the trouser hems cover the tops of the shoes
      this.legsSprite.addChild(...this.footSprites, this.legsOnly);
      this.sprite.addChildAt(this.legsSprite, 0);
    }
  }

  /**
   * Poses the body where it is, unless it's out of view: then it isn't drawn,
   * and isn't posed either, since that's most of the cost of a body. Nothing
   * else may rely on the pose being up to date; `getPartPoses` updates it.
   * The walk cycle is only for looks too, so it's moved on here, by the game
   * time since it last was.
   */
  @on("render")
  onRender(_dt: number) {
    const inView = this.game.camera.isInView(
      this.getPosition(),
      this.radius + VIEW_MARGIN,
    );
    // Not `visible`, which the owner may use (enemies fade out of sight with it)
    this.sprite.renderable = inView;
    if (inView) {
      if (this.gait) {
        const now = this.game.simulatedTime;
        this.gait.update(
          this.getPosition(),
          this.getAngle(),
          now - this.gaitTime,
        );
        this.gaitTime = now;
      }
      if (this.dangles) {
        const now = this.game.simulatedTime;
        const [x, y] = this.getPosition();
        this.dangles.update(
          x,
          y,
          this.getAngle(),
          this.getStanceAngle() + this.getTorsoTwist(),
          now - this.dangleTime,
        );
        this.dangleTime = now;
      }
      this.updatePose();
    }
  }

  /** Shoves what swings on it (m/s, in the world): a hit, a blast */
  jolt(vx: number, vy: number) {
    this.dangles?.push(vx, vy);
  }

  /** Leaves out some layers, to see what's under them (the character editor) */
  setHiddenLayers(hidden: ReadonlySet<BodyLayer>) {
    this.headSprite.visible = !hidden.has("head");
    this.torsoSprite.visible = !hidden.has("torso");
    this.dangles?.setVisible("head", !hidden.has("head"));
    this.dangles?.setVisible("torso", !hidden.has("torso"));
    this.leftArmSprite.visible = this.rightArmSprite.visible =
      !hidden.has("arms");
    this.leftHandSprite.visible = this.rightHandSprite.visible =
      !hidden.has("hands");
    this.legSprites.forEach((leg) => (leg.visible = !hidden.has("legs")));
    this.footSprites.forEach((foot) => (foot.visible = !hidden.has("feet")));
  }

  /** Puts the sprites where the body and its parts are now */
  updatePose() {
    this.sprite.position.copyFrom(this.getPosition());
    this.sprite.rotation = this.getAngle();

    this.torsoSprite.rotation = this.getStanceAngle() + this.getTorsoTwist();
    this.dangles?.pose(this.torsoSprite.rotation);
    this.poseLegs();

    const [leftShoulderPos, rightShoulderPos] = this.getShoulderPositions();
    const [leftHandPos, rightHandPos] = this.getHandPositions();

    this.poseArm(this.armSegments[0], leftShoulderPos, leftHandPos);
    this.poseArm(this.armSegments[1], rightShoulderPos, rightHandPos);

    this.leftHandSprite.position.copyFrom(leftHandPos);
    this.rightHandSprite.position.copyFrom(rightHandPos);
  }

  /**
   * Puts an arm's two halves from the shoulder to the elbow to the hand,
   * the elbow where a bent arm's would be seen from above (`elbowPosition`),
   * each half shortened as much as it's foreshortened
   */
  private poseArm([upper, fore]: [Sprite, Sprite], shoulder: V2d, hand: V2d) {
    const [ex, ey] = elbowPosition(
      [shoulder.x, shoulder.y],
      [hand.x, hand.y],
      this.upperArm,
      this.forearm,
      (STYLE.armDrop / 1000) * this.legScale,
      STYLE.elbowOut,
    );
    const place = (
      sprite: Sprite,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      length: number,
    ) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      sprite.position.set(x0, y0);
      sprite.rotation = Math.atan2(dy, dx);
      sprite.scale.x = (this.pixelScale * Math.hypot(dx, dy)) / length;
    };
    place(upper, shoulder.x, shoulder.y, ex, ey, this.upperArm);
    place(fore, ex, ey, hand.x, hand.y, this.forearm);
  }

  /**
   * Puts the legs and feet where the walk cycle has them: each leg from its
   * hip to where its foot is on the floor. Standing square, the legs are
   * under the torso, so they aren't drawn, but the feet always are.
   */
  private poseLegs() {
    const gait = this.gait;
    if (!gait || !this.legsOnly) {
      return;
    }
    const drawLegs = !gait.underBody;
    this.legsOnly.visible = drawLegs;
    const scale = this.legScale;
    const [x, y] = this.getPosition();
    const facing = this.getAngle();
    // From the world into the body's own frame, which the container turns with it
    const cos = Math.cos(-facing);
    const sin = Math.sin(-facing);
    const footForward = FOOT_FORWARD * scale;
    for (const side of SIDES) {
      const step = gait.feet[side];
      const hipDX = gait.hipX(side) - x;
      const hipDY = gait.hipY(side) - y;
      const hipX = hipDX * cos - hipDY * sin;
      const hipY = hipDX * sin + hipDY * cos;
      const ankleX = (step.x - x) * cos - (step.y - y) * sin;
      const ankleY = (step.x - x) * sin + (step.y - y) * cos;

      if (drawLegs) {
        const leg = this.legSprites[side];
        const spanX = ankleX - hipX;
        const spanY = ankleY - hipY;
        const span = Math.sqrt(spanX * spanX + spanY * spanY);
        // From half its thickness behind the hip to a little past the ankle
        const behindHip = this.legThickness / 2;
        const pastAnkle = this.legThickness * HEM_OVERLAP;
        const shift = span > 0.0001 ? (pastAnkle - behindHip) / 2 / span : 0;
        leg.position.set(
          (hipX + ankleX) / 2 + spanX * shift,
          (hipY + ankleY) / 2 + spanY * shift,
        );
        leg.rotation = span > 0.01 ? Math.atan2(spanY, spanX) : 0;
        leg.width = span + behindHip + pastAnkle;
      }

      const foot = this.footSprites[side];
      const angle = step.angle - facing;
      const size = this.pixelScale * (1 + step.lift * FOOT_LIFT_SCALE);
      foot.position.set(
        ankleX + Math.cos(angle) * footForward,
        ankleY + Math.sin(angle) * footForward,
      );
      foot.rotation = angle;
      foot.scale.set(size);
    }
  }

  /** The shoulders turning a little against the hips with each step */
  getTorsoTwist(): number {
    const gait = this.gait;
    return gait
      ? Math.sin(gait.phase * Math.PI * 2) * TORSO_TWIST * gait.stride
      : 0;
  }

  // Override me!
  getPosition() {
    return V(0, 0);
  }

  // Override me!
  getAngle() {
    return 0;
  }

  // Override me!
  getStanceAngle(): number {
    return 0;
  }

  getShoulderPositions(): [V2d, V2d] {
    const stanceAngle = this.getStanceAngle();
    const r = this.shoulderOffset;
    return [
      polarToVec(stanceAngle - Math.PI / 2, r),
      polarToVec(stanceAngle + Math.PI / 2, r),
    ];
  }

  getHandPositions(): [V2d, V2d] {
    return this.getShoulderPositions();
  }

  /** A point in the body's own coordinates, in the world, as of the last pose */
  toWorld(local: V2d): V2d {
    const { x, y } = this.sprite.position;
    return local.rotate(this.sprite.rotation).iadd([x, y]);
  }

  /** Where each part of the body is in the world and which way it points */
  getPartPoses(): BodyPoses {
    this.updatePose();
    const pose = (part: Sprite): PartPose => ({
      position: this.toWorld(V(part.position.x, part.position.y)),
      angle: this.sprite.rotation + part.rotation,
    });
    const [leftShoulder, rightShoulder] = this.getShoulderPositions();
    const [leftHand, rightHand] = this.getHandPositions();
    // An arm as a whole: halfway from the shoulder to the hand, along it
    const arm = (shoulder: V2d, hand: V2d): PartPose => ({
      position: this.toWorld(shoulder.lerp(hand, 0.5)),
      angle: this.sprite.rotation + hand.sub(shoulder).angle,
    });
    return {
      head: pose(this.headSprite),
      torso: pose(this.torsoSprite),
      leftArm: arm(leftShoulder, leftHand),
      rightArm: arm(rightShoulder, rightHand),
      leftHand: pose(this.leftHandSprite),
      rightHand: pose(this.rightHandSprite),
      leftShoulder: this.toWorld(leftShoulder),
      rightShoulder: this.toWorld(rightShoulder),
      headRadius: this.headRadius,
      armThickness: this.armThickness,
    };
  }
}

export interface PartPose {
  position: V2d;
  angle: number;
}

/** Where a body's parts were, for taking it apart (see `getPartPoses`) */
export interface BodyPoses {
  head: PartPose;
  torso: PartPose;
  leftArm: PartPose;
  rightArm: PartPose;
  leftHand: PartPose;
  rightHand: PartPose;
  leftShoulder: V2d;
  rightShoulder: V2d;
  headRadius: number;
  armThickness: number;
}

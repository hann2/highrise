import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { angleDelta } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { HUMAN_RADIUS, Persistence } from "../constants/constants";
import { BodySprite } from "../creature-stuff/BodySprite";
import { HUMAN_GAIT, ZOMBIE_GAIT } from "../creature-stuff/Legs";
import { cementFloor } from "../environment/decorations/floorDecorations";
import FloorText from "../environment/FloorText";
import RepeatingFloor from "../environment/RepeatingFloor";
import { BodyLook, Extra, PartialLook, resolveLook } from "../looks/BodyLook";
import { bakeBodies, getAppearance } from "../looks/bakeBodies";

/** Meters between lanes, how long each lane is, and the room round them */
const LANE_SPACING = 1.3;
const LENGTH = 3;
const MARGIN = 1.2;
/** How fast bodies speed up, and how hard they stop (m/s²) */
const ACCELERATION = 10;
const BRAKING = 12;

/** What each body does, over and over */
type Step =
  | { wait: number }
  | { goTo: number; speed: number }
  | { face: number; seconds: number }
  | { jolt: number };

const SCRIPT: Step[] = [
  { wait: 0.6 },
  // Walk along the lane and stop
  { goTo: LENGTH, speed: 1.4 },
  { wait: 1 },
  // Turn round on the spot, quickly
  { face: Math.PI, seconds: 0.3 },
  { wait: 0.7 },
  // Sprint back and stop dead
  { goTo: 0, speed: 5 },
  { wait: 1 },
  { face: 0, seconds: 0.3 },
  { wait: 0.7 },
  // Shoved from the side, as if hit
  { jolt: 1.5 },
  { wait: 1.2 },
];

const BASE: PartialLook = {
  skin: "#c99a73",
  hair: { coverage: 1, color: "#3a2a1c" },
  top: { style: "shirt", color: "#6d8fb3" },
};

const extra = (kind: Extra["kind"], color: string): Extra => ({
  kind,
  color,
});

/** A look for each kind of thing that swings, and one with all of them */
const LOOKS: { label: string; look: PartialLook }[] = [
  {
    label: "ponytail",
    look: { ...BASE, hair: { ...BASE.hair, style: "ponytail", length: 0.9 } },
  },
  {
    label: "pigtails",
    look: { ...BASE, hair: { ...BASE.hair, style: "pigtails", length: 0.7 } },
  },
  {
    label: "bun",
    look: { ...BASE, hair: { ...BASE.hair, style: "bun", length: 0.8 } },
  },
  {
    label: "lanyard",
    look: { ...BASE, extras: [extra("lanyard", "#2a64c8")] },
  },
  { label: "tie", look: { ...BASE, extras: [extra("tie", "#a32828")] } },
  { label: "scarf", look: { ...BASE, extras: [extra("scarf", "#c8a22a")] } },
  {
    label: "backpack",
    look: { ...BASE, extras: [extra("backpack", "#3f6b3a")] },
  },
  {
    label: "everything",
    look: {
      ...BASE,
      hair: { ...BASE.hair, style: "ponytail", length: 0.6 },
      extras: [
        extra("backpack", "#3f6b3a"),
        extra("tie", "#a32828"),
        extra("lanyard", "#2a64c8"),
      ],
    },
  },
];

/**
 * `?scene=dangles` (development only): a lane for each kind of thing that
 * swings as a body moves (`creature-stuff/Dangles.ts`): a ponytail, pigtails, a bun, a
 * lanyard, a tie, a scarf, a backpack, and all at once. Each body walks
 * along its lane and stops, turns round, sprints back and stops dead, turns
 * again, and is shoved from the side, over and over. `only=tie,scarf` picks lanes, `zoom=` sets the
 * camera, `follow` keeps it on the bodies as they go (for close ups), `zombie` makes them zombies (they walk like one too), and `?auto`
 * is for recording (`npm run clip -- --scene dangles`).
 */
export default class DanglesTestScene extends BaseEntity implements Entity {
  id = "danglesTestScene";
  persistenceLevel = Persistence.Permanent;
  /** Times the script has started */
  cycles = 0;
  private movers: Mover[] = [];
  private step = 0;
  private stepTime = 0;
  /** The camera goes along with the bodies */
  private follow = false;

  @on("add")
  async onAdd() {
    const params = new URLSearchParams(window.location.search);
    const zombie = params.has("zombie");
    this.follow = params.has("follow");
    const only = params.get("only")?.split(",");
    const lanes = LOOKS.filter(({ label }) => !only || only.includes(label));
    const looks: BodyLook[] = lanes.map(({ look }) =>
      resolveLook(
        zombie
          ? { ...look, zombie: { rot: 0.5, blood: 0.3, tears: 0.2 } }
          : look,
      ),
    );
    await bakeBodies(looks);

    // Lanes side by side, each going up the screen
    const width = lanes.length * LANE_SPACING + MARGIN;
    const height = LENGTH + MARGIN * 2;
    const view = this.game.renderer.getSize();
    const zoom =
      Number(params.get("zoom")) ||
      Math.min(view[0] / width, view[1] / height) * 0.98;
    const roomWidth = Math.max(width, view[0] / zoom);
    const roomHeight = Math.max(height, view[1] / zoom);
    const offset = V(roomWidth - width, roomHeight - height).imul(0.5);
    this.addChild(
      new RepeatingFloor(cementFloor, [0, 0], [roomWidth, roomHeight]),
    );
    this.game.camera.z = zoom;
    this.game.camera.center(V(roomWidth / 2, roomHeight / 2));

    this.movers = lanes.map(({ label }, i) => {
      const start = V(
        MARGIN / 2 + LANE_SPACING * (i + 0.5),
        MARGIN + LENGTH,
      ).iadd(offset);
      this.addChild(
        new FloorText(start.add(V(0, 0.6)), label, {
          heightMeters: 0.16,
          color: "#303030",
        }),
      );
      return this.addChild(new Mover(looks[i], start, zombie));
    });
    this.cycles = 1;
  }

  @on("render")
  onRender() {
    if (this.follow && this.movers.length > 0) {
      const middle = V(0, 0);
      for (const mover of this.movers) {
        middle.iadd(mover.getPosition());
      }
      this.game.camera.center(middle.imul(1 / this.movers.length));
    }
  }

  @on("tick")
  onTick(dt: number) {
    if (this.movers.length === 0) {
      return;
    }
    const step = SCRIPT[this.step];
    this.stepTime += dt;
    let done = false;
    if ("wait" in step) {
      done = this.stepTime >= step.wait;
    } else if ("goTo" in step) {
      // Every one moved, and done once they all are
      done = this.movers
        .map((b) => b.moveTo(step.goTo, step.speed, dt))
        .every(Boolean);
    } else if ("face" in step) {
      done = this.movers
        .map((b) => b.turnTo(step.face, step.seconds, dt))
        .every(Boolean);
    } else {
      for (const body of this.movers) {
        body.jolt(0, step.jolt);
      }
      done = true;
    }
    if (done) {
      this.stepTime = 0;
      this.step = (this.step + 1) % SCRIPT.length;
      if (this.step === 0) {
        this.cycles++;
      }
    }
  }
}

/** Which way the lanes go: up the screen */
const LANE_ANGLE = -Math.PI / 2;

/** A body on its own, moved along its lane by the scene */
class Mover extends BodySprite {
  private position: V2d;
  private velocity = 0;
  /** How far along its lane it is (meters), and which way it faces from the lane's way (radians) */
  private along = 0;
  private facing = 0;

  constructor(
    look: BodyLook,
    private start: V2d,
    private zombie: boolean,
  ) {
    const appearance = getAppearance(look);
    super(appearance.standing, HUMAN_RADIUS, {
      textures: appearance.legs,
      gait: zombie ? ZOMBIE_GAIT : HUMAN_GAIT,
    });
    this.position = start.clone();
  }

  /** Heads for `x` along its lane, at most `speed`; true once it's there and stopped */
  moveTo(x: number, speed: number, dt: number): boolean {
    const distance = x - this.along;
    const direction = Math.sign(distance);
    // As fast as it can still stop from in time
    const wanted =
      direction * Math.min(speed, Math.sqrt(2 * BRAKING * Math.abs(distance)));
    const change = wanted - this.velocity;
    const limit =
      (Math.abs(wanted) > Math.abs(this.velocity) ? ACCELERATION : BRAKING) *
      dt;
    this.velocity += Math.max(-limit, Math.min(limit, change));
    const move = this.velocity * dt;
    const done =
      Math.abs(move) >= Math.abs(distance) || Math.abs(distance) < 0.002;
    this.along = done ? x : this.along + move;
    if (done) {
      this.velocity = 0;
    }
    this.position.set(
      this.start.x + Math.cos(LANE_ANGLE) * this.along,
      this.start.y + Math.sin(LANE_ANGLE) * this.along,
    );
    return done;
  }

  /** Turns toward `facing` at a speed that takes `seconds` for half a turn; true once it's there */
  turnTo(facing: number, seconds: number, dt: number): boolean {
    const delta = angleDelta(this.facing, facing);
    const step = (Math.PI / seconds) * dt;
    if (Math.abs(delta) <= step) {
      this.facing = facing;
      return true;
    }
    this.facing += Math.sign(delta) * step;
    return false;
  }

  getPosition() {
    return this.position;
  }

  getAngle() {
    return LANE_ANGLE + this.facing;
  }

  getHandPositions(): [V2d, V2d] {
    const [left, right] = this.getShoulderPositions();
    if (this.zombie) {
      return [left.iadd(V(0.32, 0.05)), right.iadd(V(0.32, -0.05))];
    }
    return [left.iadd(V(0.08, 0.04)), right.iadd(V(0.08, -0.04))];
  }
}

import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { KeyCode } from "../../../core/io/Keys";
import { V, V2d } from "../../../core/Vector";
import { CHARACTERS } from "../../characters/Character";
import { Persistence } from "../../constants/constants";
import { cementFloor } from "../../environment/decorations/floorDecorations";
import FloorText from "../../environment/FloorText";
import RepeatingFloor from "../../environment/RepeatingFloor";
import Wall from "../../environment/Wall";
import { ignite } from "../../fire/Burning";
import FireGrid from "../../fire/FireGrid";
import Human from "../../human/Human";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import LightingManager from "../../lighting-and-vision/LightingManager";
import VisionController from "../../lighting-and-vision/VisionController";
import SimpleEnemyController from "../base/SimpleEnemyController";
import type { BodySprite } from "../../creature-stuff/BodySprite";
import Crawler from "../crawler/Crawler";
import Sprinter from "../sprinter/Sprinter";
import Zombie from "../zombie/Zombie";

/** The room, in meters: about what the camera shows */
const WIDTH = 13;
const HEIGHT = 7.2;
/** Seconds from one lineup to the next */
const CYCLE_TIME = 10;
/** Seconds between deaths */
const DEATH_INTERVAL = 0.45;
/** Where the blows come from: the left */
const RIGHT = V(1, 0);

type Victim = Zombie | Sprinter | Crawler;

interface Death {
  label: string;
  make: (position: V2d) => Victim;
  /** How it dies. Blows come from the left. */
  kill: (enemy: Victim) => void;
}

const bullet =
  (damage: number, aim: (sprite: BodySprite) => V2d) => (enemy: Victim) =>
    enemy.die(undefined, {
      kind: "bullet",
      damage,
      position: aim(enemy.bodySprite).sub(RIGHT.mul(0.3)),
      direction: RIGHT.clone(),
    });
const atHead = (sprite: BodySprite) => sprite.getPartPoses().head.position;
const atRightArm = (sprite: BodySprite) => {
  const poses = sprite.getPartPoses();
  return poses.rightShoulder.lerp(poses.rightHand.position, 0.5);
};
const atChest = (sprite: BodySprite) =>
  atHead(sprite).add(atRightArm(sprite)).imul(0.5);

const DEATHS: Death[] = [
  {
    label: "9mm",
    make: (p) => new Zombie(p),
    kill: bullet(25, atHead),
  },
  {
    label: "headshot",
    make: (p) => new Zombie(p),
    kill: bullet(34, atHead),
  },
  {
    label: "rifle, arm",
    make: (p) => new Zombie(p),
    kill: bullet(50, atRightArm),
  },
  {
    label: "shotgun",
    make: (p) => new Zombie(p),
    kill: bullet(110, atChest),
  },
  {
    label: "point blank",
    make: (p) => new Zombie(p),
    kill: bullet(180, atChest),
  },
  {
    label: "axe, head",
    make: (p) => new Zombie(p),
    kill: (enemy) =>
      enemy.die(undefined, {
        kind: "melee",
        damage: 80,
        position: atHead(enemy.bodySprite),
        direction: RIGHT.rotate(0.3),
      }),
  },
  {
    label: "grenade",
    make: (p) => new Zombie(p),
    kill: (enemy) =>
      enemy.die(undefined, {
        kind: "explosion",
        damage: 140,
        position: enemy.getPosition().sub(V(0.8, -0.4)),
        direction: V(0.8, -0.4).inormalize(),
      }),
  },
  {
    label: "burned",
    make: (p) => {
      const zombie = new Zombie(p);
      ignite(zombie, undefined, 6);
      return zombie;
    },
    kill: (enemy) => enemy.die(undefined, { kind: "burn", damage: 5 }),
  },
  {
    label: "sprinter",
    make: (p) => new Sprinter(p),
    kill: bullet(34, atHead),
  },
  {
    label: "crawler",
    make: (p) => new Crawler(p, Math.PI),
    kill: bullet(40, atChest),
  },
];

/**
 * A dev-only scene for looking at how zombies die (`?scene=deaths`): a lineup
 * of zombies that stand still, each killed a different way, from the left, one
 * after another, with its label on the floor. Enter (or `?auto`, over and
 * over) sends in a new lineup. `cycles` counts the lineups, so a recording
 * can wait for one.
 */
export default class DeathsTestScene extends BaseEntity implements Entity {
  id = "deathsTestScene";
  persistenceLevel = Persistence.Permanent;
  /** Lineups so far */
  cycles = 0;
  private auto = false;
  private player!: Human;

  @on("add")
  async onAdd() {
    this.auto = new URLSearchParams(window.location.search).has("auto");
    // Humans carry lights, so this has to exist before anyone is added
    this.addChild(new LightingManager());
    this.addChildren(
      new RepeatingFloor(cementFloor, [0, 0], [WIDTH, HEIGHT]),
      new AmbientLight(0x777777),
      new Wall([0, 0], [WIDTH, 0]),
      new Wall([0, 0], [0, HEIGHT]),
      new Wall([WIDTH, 0], [WIDTH, HEIGHT]),
      new Wall([0, HEIGHT], [WIDTH, HEIGHT]),
    );
    this.player = this.addChild(new Human(V(1, HEIGHT / 2), CHARACTERS[0]));
    // Enemies ask it whether they can be seen; no fog of war here
    const vision = this.addChild(new VisionController(() => this.player));
    vision.enabled = false;
    // Things that die burning light the floor
    this.addChild(new FireGrid()).reset(WIDTH, HEIGHT);

    this.game.camera.z = 98;
    this.game.camera.center(V(WIDTH / 2, HEIGHT / 2));

    await this.wait(0.5);
    this.lineup();
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "Enter") {
      this.lineup();
    }
  }

  @on("tick")
  onTick() {
    this.player.hp = this.player.maxHp;
    // Everyone stands still, even crawlers that get up
    for (const controller of [
      ...this.game.entities.getByConstructor(SimpleEnemyController),
    ]) {
      controller.destroy();
    }
  }

  private async lineup() {
    const cycle = ++this.cycles;
    this.game.clearScene(Persistence.Floor);

    const victims: [Death, Victim][] = DEATHS.map((death, i) => {
      const column = i % 5;
      const row = Math.floor(i / 5);
      const position = V(2.4 + column * 2.2, 2 + row * 3.3);
      const enemy = death.make(position);
      enemy.body.angle = Math.PI;
      this.game.addEntities(
        enemy,
        new FloorText(position.add(V(0, 1)), death.label, {
          heightMeters: 0.35,
          color: "#303030",
        }),
      );
      return [death, enemy];
    });

    await this.wait(1);
    for (const [death, enemy] of victims) {
      if (this.cycles !== cycle) {
        return;
      }
      if (!enemy.isDestroyed) {
        death.kill(enemy);
      }
      await this.wait(DEATH_INTERVAL);
    }
    if (this.auto) {
      await this.wait(CYCLE_TIME - 1 - DEATHS.length * DEATH_INTERVAL);
      if (this.cycles === cycle) {
        this.lineup();
      }
    }
  }
}

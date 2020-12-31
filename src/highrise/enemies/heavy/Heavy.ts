import Game from "../../../core/Game";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { rInteger, rNormal, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import {
  HUMAN_RADIUS,
  PERRY_ZOMBIE_SOUNDS,
  ZOMBIE_ATTACK_HIT_SOUNDS,
  ZOMBIE_RADIUS,
} from "../../constants/constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import FleshImpact from "../../effects/FleshImpact";
import { ShuffleRing } from "../../utils/ShuffleRing";
import { BaseEnemy } from "../base/Enemy";
import { getHumansInRange, makeSimpleEnemyBody } from "../base/enemyUtils";
import EnemyVoice from "../base/EnemyVoice";
import SimpleEnemyController from "../base/SimpleEnemyController";
import HeavySprite from "./HeavySprite";

const SPEED = 4.2;
export const HEAVY_RADIUS = ZOMBIE_RADIUS * 1.5;
const HEALTH = 1000;
const ATTACK_RANGE = HUMAN_RADIUS + HEAVY_RADIUS + 0.3;

const hitSoundRing = new ShuffleRing(ZOMBIE_ATTACK_HIT_SOUNDS);
export default class Heavy extends BaseEnemy {
  hp = rNormal(HEALTH, HEALTH / 10);

  constructor(position: V2d, angle: number = rUniform(0, Math.PI * 2)) {
    super(position);

    this.walkSpring.speed = rNormal(SPEED, SPEED / 5);

    this.addChild(new SimpleEnemyController(this, ATTACK_RANGE, HEAVY_RADIUS));
    this.addChild(new HeavySprite(this));
  }

  onAdd(game: Game) {
    super.onAdd(game);
    this.aimSpring.stiffness = 30;
    this.aimSpring.damping = 10;
  }

  makeBody(position: [number, number]) {
    return makeSimpleEnemyBody(position, HEAVY_RADIUS, 12);
  }

  makeVoice() {
    return new EnemyVoice(() => this.getPosition(), PERRY_ZOMBIE_SOUNDS);
  }

  onDie() {
    this.game?.addEntity(new FleshImpact(this.getPosition(), 9));
    this.voice.speak("death", true);
  }

  makeAttackAction() {
    return createAttackAction({
      windupDuration: 0.3,
      attackDuration: 0.12,
      windDownDuration: 0.1,
      cooldownDuration: 0.5,
      onWindupStart: () => {
        this.voice.speak("attack");
      },
      onAttack: () => {
        if (this.game) {
          for (const human of getHumansInRange(
            this.game,
            this.body.position,
            this.body.angle,
            ATTACK_RANGE
          )) {
            human.inflictDamage(rInteger(30, 45));

            this.game?.addEntity(
              new PositionalSound(hitSoundRing.getNext(), this.getPosition(), {
                speed: rNormal(0.75, 0.1),
              })
            );
          }
        }
      },
    });
  }
}

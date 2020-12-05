import BaseEntity from "../../../core/entity/BaseEntity";
import Zombie from "../Zombie";


export default class ZombieController extends BaseEntity implements Entity {
    constructor(private zombie: Zombie) {
        super();
    }

    onTick() {
        // const [
        //     nearestVisibleHuman,
        //     nearestDistance,
        //   ] = this.getNearestVisibleHuman();

        //   if (nearestVisibleHuman || this.positionOfLastTarget) {
        //     const targetPosition = nearestVisibleHuman
        //       ? nearestVisibleHuman.getPosition()
        //       : this.positionOfLastTarget;
        //     this.positionOfLastTarget = targetPosition;
        //     const direction = targetPosition!.sub(this.getPosition()).inormalize();
        //     this.walk(direction);
        //     this.face(direction.angle);
        //   }

        //   if (
        //     nearestVisibleHuman &&
        //     nearestDistance < ZOMBIE_ATTACK_RANGE &&
        //     this.attackCooldown <= 0
        //   ) {
        //     this.wait(ZOMBIE_ATTACK_WINDUP, undefined, "zombieDamage").then(() => {
        //       const [
        //         nearestVisibleHuman,
        //         nearestDistance,
        //       ] = this.getNearestVisibleHuman();
        //       if (nearestVisibleHuman && nearestDistance < ZOMBIE_ATTACK_RANGE) {
        //         nearestVisibleHuman.inflictDamage(ZOMBIE_ATTACK_DAMAGE);
        //       }
        //     });

        //     this.attackProgress = 0;
        //     this.attackCooldown = ZOMBIE_ATTACK_COOLDOWN;
        //   }
    }

    getNearestVisibleHuman(
        maxDistance: number = 15
    ): [Human | undefined, number] {
        const humans = this.game!.entities.getTagged("human") as Human[];

        let nearestVisibleHuman: Human | undefined;
        let nearestDistance: number = maxDistance;

        for (const human of humans) {
            // should you be able to sneak up on zombie???
            const distance = vec2.dist(human.body.position, this.body.position);
            if (distance < nearestDistance) {
                const isVisible = testLineOfSight(this, human);
                if (isVisible) {
                    nearestDistance = distance;
                    nearestVisibleHuman = human;
                }
            }
        }

        return [nearestVisibleHuman, nearestDistance];
    }
}
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import { testLineOfSight } from "../utils/visionUtils";
import Human from "./Human";
import Interactable from "./Interactable";
import Zombie from "./Zombie";

const FOLLOW_DISTANCE = 2; // meters

export default class AIHumanController extends BaseEntity implements Entity {
  // The human this AI is controlling
  human: Human;
  // The human this AI is following
  following?: Human;
  lastSeenPositionOfFollowing?: V2d;
  // The interaction target to make this human follow the player
  followInteractable?: Interactable;

  constructor(human: Human, following?: Human) {
    super();
    this.human = human;
    this.following = following;
  }

  onAdd() {
    if (this.following) {
      this.startFollowing(this.following);
    } else {
      this.stopFollowing();
    }
  }

  startFollowing(player: Human) {
    this.following = player;
    this.followInteractable?.destroy();

    this.game?.dispatch({
      type: "startFollowing",
      human: this.human,
      aiController: this,
    });

    // TODO: This feels a little sketchy
    // const party = player.parent as BaseEntity;
    // party.addChild(this, true);
    // party.addChild(this.human, true);
  }

  stopFollowing() {
    this.following = undefined;
    this.lastSeenPositionOfFollowing = undefined;
    this.followInteractable = this.addChild(
      new Interactable(this.human.getPosition(), (interacter) => {
        this.startFollowing(interacter);
      })
    );
  }

  onTick() {
    // If our human dies/gets removed, we shouldn't be here anymore
    if (!this.human.game) {
      this.destroy();
      return;
    }

    const nearestVisibleZombie = this.getNearestVisibleZombie();
    if (nearestVisibleZombie) {
      const direction = nearestVisibleZombie
        .getPosition()
        .isub(this.human.getPosition()).angle;

      this.human.setDirection(direction);
      this.human.pullTrigger();
    } else if (this.following) {
      if (testLineOfSight(this.human, this.following)) {
        this.lastSeenPositionOfFollowing = this.following.getPosition();
        const direction = this.lastSeenPositionOfFollowing.sub(
          this.human.getPosition()
        );
        const distance = direction.magnitude;
        if (distance > FOLLOW_DISTANCE) {
          this.human.walk(direction.inormalize());
        }
      } else if (this.lastSeenPositionOfFollowing) {
        const direction = this.lastSeenPositionOfFollowing.sub(
          this.human.getPosition()
        );
        this.human.walk(direction.inormalize());
      }
    }

    if (this.followInteractable) {
      this.followInteractable.position = this.human.getPosition();
    }

    if (this.human.hp <= 0) {
      this.human.destroy();
      this.destroy();
    }
  }

  getNearestVisibleZombie(): Zombie | undefined {
    const zombies = this.game!.entities.getTagged("zombie") as Zombie[];

    let nearestVisibleZombie: Zombie | undefined;
    let nearestDistance: number = Infinity;

    for (const zombie of zombies) {
      const isVisible = testLineOfSight(this.human, zombie);
      const distance = zombie.getPosition().sub(this.human.getPosition())
        .magnitude;
      if (isVisible && distance < nearestDistance) {
        nearestDistance = distance;
        nearestVisibleZombie = zombie;
      }
    }

    return nearestVisibleZombie;
  }
}

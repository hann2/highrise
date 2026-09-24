import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { polarToVec } from "../../core/util/MathUtil";
import { rDirection, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { HUMAN_RADIUS } from "../constants/constants";
import Interactable from "../environment/Interactable";
import Human from "../human/Human";

/** How close the player has to be for someone to turn and look at them */
const NOTICE_DISTANCE = 3;
/** How far from their spot someone mills about */
const WANDER_RADIUS = 0.6;
/** Further than this from their spot and they head back */
const STRAY_DISTANCE = 1.2;
/** Fraction of full speed for milling about */
const WANDER_SPEED = 0.25;
/** How close counts as having got there */
const ARRIVE_DISTANCE = 0.1;

/**
 * Someone standing around in the lobby, waiting to be picked. Mills about near
 * their spot and turns to look at the player when they come close. Never
 * fights: they have nothing to fight with. Interacting with them swaps the
 * player into them. Only rescued characters are in the lobby at all.
 */
export default class LobbyCharacterController
  extends BaseEntity
  implements Entity
{
  tags = ["lobby_character"];
  interactable: Interactable;

  /** Where they're walking to, if anywhere */
  private target?: V2d;
  /** Seconds until they next wander somewhere */
  private restTime = rUniform(1, 5);

  constructor(
    public human: Human,
    /** Where they hang around */
    private home: V2d,
    private getPlayer: () => Human,
    /** Swaps the player into this character */
    private onChosen: (controller: LobbyCharacterController) => void,
  ) {
    super();

    human.flashlight.light.enabled = false;

    this.interactable = this.addChild(
      new Interactable(human.getPosition().clone(), () =>
        this.handleInteract(),
      ),
    );
    this.interactable.maxDistance = 1.6;
    this.interactable.highlightRadius = HUMAN_RADIUS + 0.2;
    this.interactable.prompt = () => ({
      title: this.human.character.name,
      action: "Select",
    });
  }

  private handleInteract() {
    this.onChosen(this);
  }

  @on("tick")
  onTick(dt: number) {
    const human = this.human;
    if (human.isDestroyed) {
      this.destroy();
      return;
    }
    const position = human.getPosition();
    this.interactable.position.set(position);

    // Pushed out of place (or just swapped out of): head back
    if (!this.target && position.distanceTo(this.home) > STRAY_DISTANCE) {
      this.target = this.home.clone();
    }

    const toPlayer = this.getPlayer().getPosition().sub(position);
    const noticing = toPlayer.magnitude < NOTICE_DISTANCE;

    if (this.target) {
      const toTarget = this.target.sub(position);
      if (toTarget.magnitude < ARRIVE_DISTANCE) {
        this.target = undefined;
        this.restTime = rUniform(3, 8);
      } else {
        human.walkSpring.walkTowards(toTarget.angle, WANDER_SPEED);
        human.setDirection(toTarget.angle, dt);
        return;
      }
    }

    human.walkSpring.walkTowards(0, 0);
    if (noticing) {
      human.setDirection(toPlayer.angle, dt);
      return;
    }

    this.restTime -= dt;
    if (this.restTime <= 0) {
      this.target = this.home.add(
        polarToVec(rDirection(), rUniform(0, WANDER_RADIUS)),
      );
    }
  }
}

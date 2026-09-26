import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { V2d } from "../../core/Vector";
import Door from "./Door";
import { getPartyLeader } from "./PartyManager";

// Once the leader is out, the door waits this long, and until they're this far
// from the doorway, before it locks
const SEAL_GRACE_TIME = 1;
const SEAL_CLEAR_DISTANCE = 1.2;

/**
 * The room a floor starts in. Its door only opens outwards, so nothing gets
 * in from the hallway, and once the leader has left it locks for good: the
 * store in here is for before the floor, not a place to come back to. (Allies
 * are never in here; they're found on the floor and leave at its end.)
 */
export default class ArrivalRoom extends BaseEntity implements Entity {
  tags = ["arrival_room"];
  /** Locked for good */
  sealed = false;
  private leaderOutsideTime = 0;

  constructor(
    /** Upper left corner of the room in world coordinates */
    public min: V2d,
    /** Lower right corner of the room in world coordinates */
    public max: V2d,
    private getDoor: () => Door | undefined,
  ) {
    super();
  }

  get door(): Door | undefined {
    return this.getDoor();
  }

  contains([x, y]: V2d): boolean {
    return (
      x >= this.min.x && x <= this.max.x && y >= this.min.y && y <= this.max.y
    );
  }

  @on("tick")
  onTick(dt: number) {
    const door = this.door;
    const leader = getPartyLeader(this.game);
    if (this.sealed || !door || !leader || leader.isDestroyed) {
      return;
    }
    const position = leader.getPosition();
    if (this.contains(position)) {
      this.leaderOutsideTime = 0;
      return;
    }
    this.leaderOutsideTime += dt;
    if (
      this.leaderOutsideTime > SEAL_GRACE_TIME &&
      position.distanceTo(door.getDoorwayCenter()) > SEAL_CLEAR_DISTANCE
    ) {
      this.seal();
    }
  }

  seal() {
    if (this.sealed) {
      return;
    }
    this.sealed = true;
    const door = this.door;
    if (door) {
      door.setLocked(true);
      this.game.addEntity(
        new PositionalSound("heavySwitchThrow", door.getDoorwayCenter()),
      );
    }
  }
}

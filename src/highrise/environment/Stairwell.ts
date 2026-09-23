import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { V, V2d } from "../../core/Vector";
import Door from "./Door";
import { getPartyManager } from "./PartyManager";

// How close a party member in the hallway has to be for the door to unlock for them
const OPEN_FOR_PARTY_DISTANCE = 2.5;
// Once the leader is inside, the door waits this long, and until nobody in the
// party is this close to the doorway, so allies right behind get in too
const SEAL_GRACE_TIME = 1;
const SEAL_CLEAR_DISTANCE = 1.2;
// ...but it doesn't wait for stragglers forever
const SEAL_MAX_WAIT = 5;

/**
 * The safe zone at the end of a floor. Its door only opens inwards, and only
 * for the party (zombies on their own can't get it open). Once the leader is
 * inside it locks for good: nothing follows them in, and there's no going back.
 */
export default class Stairwell extends BaseEntity implements Entity {
  tags = ["stairwell"];
  /** Locked for good */
  sealed = false;
  private leaderInsideTime = 0;

  constructor(
    /** Upper left corner of the stairwell in world coordinates */
    public min: V2d,
    /** Lower right corner of the stairwell in world coordinates */
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

  /**
   * A point `distance` into the stairwell from the middle of its doorway, for
   * allies to head for when the leader is inside
   */
  getInsideOfDoorway(distance: number): V2d | undefined {
    const doorway = this.door?.getDoorwayCenter();
    if (!doorway) {
      return undefined;
    }
    // The doorway is on one edge of the box; inward is away from that edge
    const [x, y] = doorway;
    const edgeDistances: [number, V2d][] = [
      [Math.abs(x - this.min.x), V(1, 0)],
      [Math.abs(x - this.max.x), V(-1, 0)],
      [Math.abs(y - this.min.y), V(0, 1)],
      [Math.abs(y - this.max.y), V(0, -1)],
    ];
    edgeDistances.sort((a, b) => a[0] - b[0]);
    return doorway.add(edgeDistances[0][1].imul(distance));
  }

  @on("tick")
  onTick(dt: number) {
    const door = this.door;
    const party = getPartyManager(this.game);
    if (this.sealed || !door || !party) {
      return;
    }

    const doorway = door.getDoorwayCenter();
    const leader = party.leader;
    if (leader && !leader.isDestroyed && this.contains(leader.getPosition())) {
      this.leaderInsideTime += dt;
    } else {
      this.leaderInsideTime = 0;
    }

    if (this.leaderInsideTime > 0) {
      const someoneInDoorway = party.partyMembers.some(
        (member) =>
          member.getPosition().distanceTo(doorway) < SEAL_CLEAR_DISTANCE,
      );
      if (
        (this.leaderInsideTime > SEAL_GRACE_TIME && !someoneInDoorway) ||
        this.leaderInsideTime > SEAL_MAX_WAIT
      ) {
        this.seal();
      }
      return;
    }

    const partyAtDoor = party.partyMembers.some((member) => {
      const position = member.getPosition();
      return (
        !this.contains(position) &&
        position.distanceTo(doorway) < OPEN_FOR_PARTY_DISTANCE
      );
    });
    door.setLocked(!partyAtDoor);
  }

  @on("levelComplete")
  onLevelComplete() {
    this.seal();
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

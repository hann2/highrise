import img_chainLinkFence from "../../../../resources/images/environment/chain-link-fence.png";
import Entity from "../../../core/entity/Entity";
import { CELL_WIDTH } from "../../constants/constants";
import Door from "../../environment/Door";
import { Direction } from "../../utils/directions";
import CellGrid, { DoorBuilder, WallID } from "./CellGrid";

export function wallIDToDoorBuilder(
  wallID: WallID,
  reverseHinge: boolean = false,
  chainLink: boolean = false
): DoorBuilder {
  const [cell, right] = wallID;
  let restingDirection = right ? Direction.DOWN : Direction.RIGHT;
  if (reverseHinge) {
    restingDirection = restingDirection.mul(-1);
  }

  const hingeDirection = restingDirection
    .mul(-1)
    .add(right ? Direction.RIGHT : Direction.DOWN);
  const hingePoint = cell.add(hingeDirection.mul(0.5));

  return {
    wallID: wallID,
    hingePoint,
    restingDirection,
    chainLink,
  };
}

export function buildDoorEntity(
  cellGrid: CellGrid,
  doorBuilder: DoorBuilder
): Entity {
  // Used to determine how far a door can swing before it will hit a wall.
  const countConsecutiveWallsThatExist = (walls: WallID[]) => {
    let count = 0;
    for (const wall of walls) {
      count += 1;
      if (cellGrid.isExisting(wall)) {
        break;
      }
    }
    return count;
  };

  const directionsClockwise = [
    Direction.DOWN,
    Direction.LEFT,
    Direction.UP,
    Direction.RIGHT,
  ];

  const doorDirection = doorBuilder.restingDirection;
  const hingePoint = doorBuilder.hingePoint;

  const dIndex = directionsClockwise.findIndex(
    (dir) => dir.x === doorDirection.x && dir.y === doorDirection.y
  );

  const wallsClockwiseFromHingePoint: WallID[] = [];
  for (let i = 0; i < 3; i++) {
    const wall = CellGrid.getWallInDirectionFromGridPoint(
      hingePoint,
      directionsClockwise[(i + dIndex + 1) % 4]
    );
    wallsClockwiseFromHingePoint.push(wall);
  }

  const wallsCounterClockwiseFromHingePoint = [
    ...wallsClockwiseFromHingePoint,
  ].reverse();
  const ccwWallCount = countConsecutiveWallsThatExist(
    wallsCounterClockwiseFromHingePoint
  );
  const cwWallCount = countConsecutiveWallsThatExist(
    wallsClockwiseFromHingePoint
  );
  const minAngle = (ccwWallCount - 0.1) * -(Math.PI / 2);
  const maxAngle = (cwWallCount - 0.1) * (Math.PI / 2);

  return new Door(
    CellGrid.levelCoordToWorldCoord(hingePoint),
    CELL_WIDTH,
    doorDirection.angle,
    minAngle,
    maxAngle,
    !doorBuilder.chainLink,
    doorBuilder.chainLink ? img_chainLinkFence : undefined
  );
}

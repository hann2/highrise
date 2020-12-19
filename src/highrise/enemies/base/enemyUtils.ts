import { Body, Circle } from "p2";
import Game from "../../../core/Game";
import { angleDelta } from "../../../core/util/MathUtil";
import { V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import Human, { isHuman } from "../../human/Human";

export function makeSimpleEnemyBody(
  position: [number, number],
  radius: number
) {
  const body = new Body({ mass: 1, position: position });
  const shape = new Circle({ radius });
  shape.collisionGroup = CollisionGroups.Zombies;
  shape.collisionMask = CollisionGroups.All;
  body.addShape(shape);
  return body;
}

export function getHumansInRange(
  game: Game,
  position: [number, number],
  angle: number,
  range: number = 1,
  angleRange: number = Math.PI / 2
): Human[] {
  const humans = [...game.entities.getByFilter(isHuman)];
  return humans.filter((human) => {
    const displacement = human.getPosition().sub(position);
    const inRange = displacement.magnitude < range;
    const diffAngle = angleDelta(displacement.angle, angle);
    const inAngle = Math.abs(diffAngle) < angleRange;
    return inRange && inAngle;
  });
}

export function lerpOffsets(
  [leftBase, rightBase]: [V2d, V2d],
  [leftStart, rightStart]: [V2d, V2d],
  [leftEnd, rightEnd]: [V2d, V2d],
  t: number
): [V2d, V2d] {
  const leftOffset = leftStart.lerp(leftEnd, t);
  const rightOffset = rightStart.lerp(rightEnd, t);
  return [leftBase.iadd(leftOffset), rightBase.iadd(rightOffset)];
}

import { V } from "../../../core/Vector";
import RoomTemplate from "./RoomTemplate";

const dimensions = V(3, 2);
const zombieLocations = [];
for (let i = 0; i < dimensions.x; i++) {
  for (let j = 0; j < dimensions.y; j++) {
    zombieLocations.push(V(i, j).add(V(0.25, 0.25)));
    zombieLocations.push(V(i, j).add(V(0.25, -0.25)));
    zombieLocations.push(V(i, j).add(V(-0.25, 0.25)));
    zombieLocations.push(V(i, j).add(V(-0.25, -0.25)));
  }
}

export const zombieRoomTemplate: RoomTemplate = new RoomTemplate(
  dimensions,
  [
    [V(-1, 1), true],
    [V(2, -1), false],
  ],
  zombieLocations
);

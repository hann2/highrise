import { choose, seededShuffle } from "../../../../core/util/Random";
import BathroomTemplate, {
  BATHROOM_STYLES,
} from "../../rooms/BathroomTemplate";
import TransformedRoomTemplate, {
  POSSIBLE_ORIENTATIONS,
} from "../../rooms/TransformedRoomTemplate";

// Generates two bathrooms with matching style and different orientations
export function makeBathroomPair(
  seed: number,
  possibleStyles = BATHROOM_STYLES
) {
  const bathroomStyle = choose(...possibleStyles);
  const shuffledOrientations = seededShuffle(POSSIBLE_ORIENTATIONS, seed);

  return [
    new TransformedRoomTemplate(
      new BathroomTemplate(bathroomStyle),
      shuffledOrientations[0]
    ),
    new TransformedRoomTemplate(
      new BathroomTemplate(bathroomStyle),
      shuffledOrientations[1]
    ),
  ];
}

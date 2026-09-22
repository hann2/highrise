import { DiagonalDirection, DirectionName } from "../../utils/directions";
import { DecorationInfo } from "./DecorationInfo";

/** The tiles for drawing a bordered floor, keyed by which side the border is on */
export interface DirectionalSprite {
  baseSprites: Record<DirectionName | "CENTER", DecorationInfo>;
  insideCorners: Record<DiagonalDirection, DecorationInfo>;
}

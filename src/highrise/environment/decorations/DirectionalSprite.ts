import { Direction } from "../../utils/directions";
import { DecorationInfo } from "./DecorationInfo";

export interface DirectionalSprite {
  baseSprites: Record<keyof typeof Direction, DecorationInfo>;
  insideCorners: Record<keyof typeof Direction, DecorationInfo>;
}

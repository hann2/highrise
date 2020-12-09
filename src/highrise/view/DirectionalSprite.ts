import { Direction } from "../utils/directions";
import { DecorationSprite } from "./DecorationSprite";

export interface DirectionalSprite {
  baseSprites: Record<keyof typeof Direction, DecorationSprite>;
  insideCorners: Record<keyof typeof Direction, DecorationSprite>;
}

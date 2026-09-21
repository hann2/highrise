import Game from "../Game";
import { V2d } from "../Vector";

export type BaseGameEvents = {
  /** Called when added to the game */
  add: { game: Game };
  /** Called right after being added to the game */
  afterAdded: { game: Game };
  /** Called after physics */
  afterPhysics: void;
  /** Called before the tick happens */
  beforeTick: number;
  /** Called before rendering */
  render: number;
  /** Called _right_ before rendering. This is for special cases only */
  lateRender: number;
  /** Called during the update tick */
  tick: number;
  /** Called less frequently */
  slowTick: number;
  /** Called when the game is paused */
  pause: void;
  /** Called when the game is unpaused */
  unpause: void;
  /** Called after being destroyed */
  destroy: { game: Game };
  /** Called when the renderer is resized or recreated for some reason */
  resize: { size: V2d };
  /** Called when the slow motion factor changes */
  slowMoChanged: { slowMo: number };
};

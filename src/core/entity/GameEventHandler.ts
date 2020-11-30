import Game from "../Game";

export interface CustomHandlersMap {
  [eventType: string]: (event: any) => void;
}

export default interface GameEventHandler {
  /** Custom event handlers */
  readonly handlers?: CustomHandlersMap;
  /** Called when added to the game */
  onAdd?(game: Game): void;
  /** Called right after being added to the game */
  afterAdded?(game: Game): void;
  /** Called after physics */
  afterPhysics?(): void;
  /** Called before the tick happens */
  beforeTick?(): void;
  /** Called before rendering */
  onRender?(): void;
  /** Called during the update tick */
  onTick?(dt: number): void;
  /** Called when the game is paused */
  onPause?(): void;
  /** Called when the game is unpaused */
  onUnpause?(): void;
  /** Called after being destroyed */
  onDestroy?(game: Game): void;
}

import type Human from "../../human/Human";

/**
 * Something carried in the usable slot and used on yourself with C / RB, a
 * charge at a time (health packs and the like). The list of them is in
 * `usables.ts`.
 */
export interface UsableStats {
  readonly name: string;
  /** One line for cards, pickups and the encyclopedia */
  readonly description: string;
  /** Charges a fresh one has, and the most it can hold */
  readonly charges: number;
  /** For drawing it: the case, and the mark on it */
  readonly color: number;
  readonly accentColor: number;
  /**
   * Does its thing to `human`. False if it wouldn't do anything (a health pack
   * at full health), so no charge is spent.
   */
  use(human: Human): boolean;
}

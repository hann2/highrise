import { loadSaveData, updateSaveData } from "../persistence/SaveData";

/**
 * The canvas's antialiasing, the player's choice (`SaveData.antialias`): on,
 * off, or Auto (undefined), which is off on displays with two or more pixels
 * per point, where edges are smooth enough without it, and on otherwise. It
 * can only be chosen when the canvas is made, so a change applies the next
 * time the game starts. At resolution 2 it costs a few tenths of a
 * millisecond a frame, mostly in passes drawn over the whole canvas, like
 * the damage filter.
 */

/** The choice, once read from the save */
let choice: { antialias: boolean | undefined } | undefined;

/** The player's choice: true, false, or undefined for Auto */
export function getAntialiasChoice(): boolean | undefined {
  choice ??= { antialias: loadSaveData().antialias };
  return choice.antialias;
}

export function setAntialiasChoice(antialias: boolean | undefined) {
  choice = { antialias };
  updateSaveData((data) => {
    data.antialias = antialias;
  });
}

/** Whether the canvas should be antialiased for `choice` on this display */
export function antialiasFor(antialias: boolean | undefined): boolean {
  return antialias ?? (window.devicePixelRatio || 1) < 2;
}

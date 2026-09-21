// @ts-nocheck
/*
 * Attach all sorts of hacky stuff to the global state.
 * This happens as a side effect of importing this module so that it can be
 * guaranteed to run before other modules are evaluated.
 */

import * as PIXI from "pixi.js";

if (!window.AudioContext && window.webkitAudioContext) {
  window.AudioContext = window.webkitAudioContext;
}

// pixi-tilemap expects this to exist
window.PIXI = PIXI;

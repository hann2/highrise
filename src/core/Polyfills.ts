// @ts-nocheck
/*
 * Attach hacky stuff to the global state.
 * This happens as a side effect of importing this module so that it can be
 * guaranteed to run before other modules are evaluated.
 */

if (!window.AudioContext && window.webkitAudioContext) {
  window.AudioContext = window.webkitAudioContext;
}

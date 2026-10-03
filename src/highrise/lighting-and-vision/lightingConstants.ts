/**
 * Pixels per meter of the light atlas (the lights, and their shadow masks).
 * The Lighting Detail setting; change it with `LightingManager.setResolution`,
 * which starts the atlases over at the new size.
 */
export let lightResolution = 32;

export function setLightResolution(pixelsPerMeter: number) {
  lightResolution = pixelsPerMeter;
}

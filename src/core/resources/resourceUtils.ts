import { FontName, ImageName, SoundName } from "../../../resources/resources";

/**
 * Looks like it does nothing, but adds typechecking to make it easy to
 * autocomplete to available sounds.
 */
export function soundName(name: SoundName): SoundName {
  return name;
}

/**
 * Looks like it does nothing, but adds typechecking to make it easy to
 * autocomplete to available images.
 */
export function imageName(name: ImageName): ImageName {
  return name;
}

/**
 * Looks like it does nothing, but adds typechecking to make it easy to
 * autocomplete to available fonts.
 */
export function fontName(name: FontName): FontName {
  return name;
}

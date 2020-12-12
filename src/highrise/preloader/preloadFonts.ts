import captureIt from "../../../resources/fonts/capture_it/capture_it.ttf";
import comfortaaVariableFontWght from "../../../resources/fonts/Comfortaa/Comfortaa-VariableFont_wght.ttf";
import dsDigi from "../../../resources/fonts/ds-digi/ds-digi.ttf";

export function getFontsToPreload() {
  return [
    new FontFace("DS Digital", `url(${dsDigi})`),
    new FontFace("Capture It", `url(${captureIt})`),
    new FontFace("Comfortaa", `url(${comfortaaVariableFontWght})`),
  ];
}

import fnt_captureIt from "../../../resources/fonts/capture_it/capture_it.ttf";
import fnt_comfortaaVariableFontWght from "../../../resources/fonts/Comfortaa/Comfortaa-VariableFont_wght.ttf";
import fnt_dsDigi from "../../../resources/fonts/ds-digi/ds-digi.ttf";

export function getFontsToPreload() {
  return [
    new FontFace("DS Digital", `url(${fnt_dsDigi})`),
    new FontFace("Capture It", `url(${fnt_captureIt})`),
    new FontFace("Comfortaa", `url(${fnt_comfortaaVariableFontWght})`),
  ];
}

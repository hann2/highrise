import captureIt from "../../../resources/fonts/capture_it/capture_it.ttf";
import dsDigi from "../../../resources/fonts/ds-digi/ds-digi.ttf";

export function getFontsToPreload() {
  return [
    new FontFace("DS Digital", `url(${dsDigi})`),
    new FontFace("Capture It", `url(${captureIt})`),
  ];
}

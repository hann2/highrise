import { Filter } from "pixi.js";
import frag_light from "./light.frag";
import frag_shadow from "./shadow.frag";

export class ShadowFilter extends Filter {
  constructor() {
    super(undefined, frag_shadow);
  }
}

export class LightFilter extends Filter {
  constructor() {
    super(undefined, frag_light);
  }
}

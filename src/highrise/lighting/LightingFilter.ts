import { Filter } from "pixi.js";
import lightFrag from "./light.frag";
import shadowFrag from "./shadow.frag";

export class ShadowFilter extends Filter {
  constructor() {
    super(undefined, shadowFrag);
  }
}

export class LightFilter extends Filter {
  constructor() {
    super(undefined, lightFrag);
  }
}

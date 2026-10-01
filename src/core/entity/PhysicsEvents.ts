import { ContactEquation } from "../physics/equations/ContactEquation";
import { Shape } from "../physics/shapes/Shape";
import type Entity from "./Entity";

export type PhysicsEvents = {
  /**
   * Called when a physics contact starts. The contact equations are reused
   * by the next physics step, so they're only good during the handler: copy
   * whatever's needed from them.
   */
  beginContact: {
    other?: Entity;
    otherShape: Shape;
    thisShape: Shape;
    contactEquations: ContactEquation[];
  };

  /** Called when a physics contact ends */
  endContact: {
    other?: Entity;
    otherShape: Shape;
    thisShape: Shape;
  };

  /** Called after every physics step for each contact that's going on */
  contacting: {
    other?: Entity;
    otherShape: Shape;
    thisShape: Shape;
  };

  /** Called when a physics impact happens */
  impact: { other?: Entity };
};

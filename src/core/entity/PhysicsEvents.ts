import { ContactEquation, Shape } from "p2";
import Entity from "./Entity";

export type PhysicsEvents = {
  /** Called when a physics contact starts */
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

  /** Called every after the physics step */
  contacting: {
    other?: Entity;
    otherShape: Shape;
    thisShape: Shape;
    contactEquations: ContactEquation[];
  };

  /** Called when a physics impact happens */
  impact: { other?: Entity };
};

import { Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { smoothStep } from "../../core/util/MathUtil";
import { Layers } from "../layers";
import ClickableText from "./ClickableText";

const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeI8Y0p8ALdzLwLPo1lbx_ec1Mt8OYySmJc_WtLekTXcF0sGA/viewform?usp=sf_link";

export default class FeedbackButton extends ClickableText {
  constructor() {
    super("Feedback", () => window.open(FEEDBACK_URL, "_blank"));
  }
}

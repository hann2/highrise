import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { KeyCode } from "../../core/io/Keys";
import { Persistence } from "../constants/constants";

export enum GraphicsQuality {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}

function parseQuality(quality: string | null): GraphicsQuality | undefined {
  if (!quality) {
    return undefined;
  }
  for (const value of Object.values(GraphicsQuality)) {
    if (value === quality) {
      return value;
    }
  }
  return undefined;
}

const DEFAULT_QUALITY = GraphicsQuality.Medium;

export const MAX_RESOLUTION = window.devicePixelRatio || 1;

export class GraphicsQualityController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;
  pausable = false;

  currentQuality: GraphicsQuality = DEFAULT_QUALITY;

  constructor() {
    super();
    const savedQuality = parseQuality(localStorage.getItem("graphicsQuality"));
    this.currentQuality = savedQuality ?? DEFAULT_QUALITY;
  }

  @on("add")
  onAdd() {
    this.setGraphicsQuality(this.currentQuality);
  }

  setGraphicsQuality(quality: GraphicsQuality) {
    this.currentQuality = quality;
    this.game?.dispatch("graphicsQualityChanged", { quality });
    localStorage.setItem("graphicsQuality", quality);
  }

  nextGraphicsQuality() {
    if (this.currentQuality === GraphicsQuality.Low) {
      this.setGraphicsQuality(GraphicsQuality.Medium);
    } else if (this.currentQuality === GraphicsQuality.Medium) {
      this.setGraphicsQuality(GraphicsQuality.High);
    } else {
      this.setGraphicsQuality(GraphicsQuality.Low);
    }
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "KeyO") {
      this.nextGraphicsQuality();
    }
  }

  @on("toggleGraphicsQuality")
  onToggleGraphicsQuality() {
    this.nextGraphicsQuality();
  }

  @on("graphicsQualityChanged")
  onGraphicsQualityChanged({ quality }: { quality: GraphicsQuality }) {
    this.game?.renderer.setResolution(getResolutionForGraphicsQuality(quality));
  }
}

export function getCurrentGraphicsQuality(game: Game): GraphicsQuality {
  return game.entities.getSingleton(GraphicsQualityController).currentQuality;
}

export function getResolutionForGraphicsQuality(
  quality: GraphicsQuality,
): number {
  switch (quality) {
    case GraphicsQuality.Low:
      return MAX_RESOLUTION / 2;
    case GraphicsQuality.Medium:
      return MAX_RESOLUTION;
    case GraphicsQuality.High:
      return MAX_RESOLUTION;
  }
}

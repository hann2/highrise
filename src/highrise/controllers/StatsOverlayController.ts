import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
import FPSMeter from "../../core/util/FPSMeter";
import ProfilerOverlay from "../../core/util/ProfilerOverlay";
import { Persistence } from "../constants/constants";

const MODES = ["off", "fps", "profiler"] as const;
export type StatsOverlayMode = (typeof MODES)[number];

/** Backslash cycles the corner stats: off → fps → fps + profiler breakdown. */
export class StatsOverlayController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;

  constructor(private mode: StatsOverlayMode = "off") {
    super();
  }

  @on("add")
  onAdd() {
    this.setMode(this.mode);
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "Backslash") {
      this.setMode(MODES[(MODES.indexOf(this.mode) + 1) % MODES.length]);
    }
  }

  setMode(mode: StatsOverlayMode) {
    this.mode = mode;
    this.game.entities.getSingleton(FPSMeter).sprite.visible = mode !== "off";
    this.game.entities
      .getSingleton(ProfilerOverlay)
      .setVisible(mode === "profiler");
  }
}

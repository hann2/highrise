import { ComponentChildren } from "preact";
import { desktop } from "../../core/desktop";
import Game from "../../core/Game";
import { getCurrentGraphicsQuality } from "../controllers/GraphicsQualityController";
import { getVolumeController } from "../controllers/VolumeController";
import "./menu.css";

const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeI8Y0p8ALdzLwLPo1lbx_ec1Mt8OYySmJc_WtLekTXcF0sGA/viewform?usp=sf_link";

/** A column of MenuButtons in a corner of the screen. */
export function MenuButtons({
  corner,
  opacity = 1,
  children,
}: {
  corner: "top-left" | "bottom-right";
  opacity?: number;
  children: ComponentChildren;
}) {
  return (
    <div className={`menu-buttons menu-buttons--${corner}`} style={{ opacity }}>
      {children}
    </div>
  );
}

export function MenuButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ComponentChildren;
}) {
  return (
    <div className="menu-button" onClick={onClick}>
      {children}
    </div>
  );
}

export function FeedbackButton() {
  return (
    <MenuButton onClick={() => window.open(FEEDBACK_URL, "_blank")}>
      Feedback
    </MenuButton>
  );
}

export function MuteButton({ game }: { game: Game }) {
  const muted = getVolumeController(game).muted;
  return (
    <MenuButton onClick={() => game.dispatch("toggleMute", undefined)}>
      {muted ? "Unmute" : "Mute"}
    </MenuButton>
  );
}

export function GraphicsButton({ game }: { game: Game }) {
  return (
    <MenuButton
      onClick={() => game.dispatch("toggleGraphicsQuality", undefined)}
    >
      Graphics: {getCurrentGraphicsQuality(game)}
    </MenuButton>
  );
}

/** Fullscreen or windowed, in the desktop app (a browser has its own ways) */
export function FullscreenButton() {
  if (!desktop) {
    return null;
  }
  const fullscreen = desktop.isFullscreen();
  return (
    <MenuButton onClick={() => desktop!.setFullscreen(!fullscreen)}>
      Fullscreen: {fullscreen ? "On" : "Off"}
    </MenuButton>
  );
}

/** Closes the desktop app. A browser tab is closed by the browser. */
export function QuitButton({ label = "Quit" }: { label?: string }) {
  if (!desktop) {
    return null;
  }
  return <MenuButton onClick={() => desktop!.quit()}>{label}</MenuButton>;
}

export function AutoPauseButton({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <MenuButton onClick={onClick}>
      Auto-Pause: {enabled ? "On" : "Off"}
    </MenuButton>
  );
}

import type { ProfileStats } from "./types";

export interface ProfileRowProps {
  stat: ProfileStats;
  frameTotalMs: number;
}

export const ProfileRow = ({ stat, frameTotalMs }: ProfileRowProps) => {
  // The root of the tree is the whole frame
  const isSlow = stat.depth === 0 && stat.msPerFrame > 16.67;

  // Calculate bar width as percentage of frame time
  const barPercent = Math.min(
    100,
    100 - (stat.msPerFrame / frameTotalMs) * 100,
  );

  // Slight bar color variation by depth
  const barColor = `hsl(235, 80%, ${40 + stat.depth * 4}%)`;

  // Display calls per frame if > 1
  const callsDisplay =
    stat.callsPerFrame >= 1
      ? `(x${Math.round(stat.callsPerFrame).toLocaleString()})`
      : "";

  const timeDisplay = stat.msPerFrame.toFixed(2) + "ms";
  const maxDisplay = "max " + stat.maxMs.toFixed(1);

  const indent = "  ".repeat(stat.depth);
  const copyText = `${indent}${stat.shortLabel}${callsDisplay ? " " + callsDisplay : ""} ${timeDisplay}`;

  return (
    <div
      className={`profile-row ${isSlow ? "profile-row--slow" : ""}`}
      style={{
        paddingLeft: `${stat.depth * 16}px`,
        background: `linear-gradient(to right, transparent 0% ${barPercent}%, ${barColor} ${barPercent}%)`,
      }}
    >
      <span className="profile-row__copy">{copyText}</span>
      <div className="profile-row__label" aria-hidden="true">
        {stat.shortLabel}
        {callsDisplay && (
          <span className="profile-row__calls">{callsDisplay}</span>
        )}
      </div>
      <div className="profile-row__time" aria-hidden="true">
        <span className="profile-row__max">{maxDisplay}</span>
        {timeDisplay}
      </div>
    </div>
  );
};

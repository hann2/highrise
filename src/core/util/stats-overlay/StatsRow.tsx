import { JSX } from "preact/jsx-runtime";

export interface StatsRowProps {
  label: string | JSX.Element;
  value: string | number;
  color?: "warning" | "error" | "success" | "muted" | "dim";
  indent?: boolean | number;
}

export const StatsRow = ({ label, value, color, indent }: StatsRowProps) => {
  // Support both boolean and numeric indent levels
  const indentLevel = indent === true ? 1 : indent || 0;
  const indentStyle =
    indentLevel > 0 ? { paddingLeft: `${indentLevel * 12}px` } : undefined;

  const valueClass = color
    ? `stats-row__value stats-row__value--${color}`
    : "stats-row__value";

  return (
    <div className="stats-row" style={indentStyle}>
      <span className="stats-row__label">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
};

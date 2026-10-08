import { tip } from "./tooltips";

export interface Option<T extends string> {
  value: T;
  label: string;
  tip?: string;
  /** Can't be picked (and the tooltip says why) */
  disabled?: boolean;
}

/** One of a few, as a row of buttons */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div class="segmented">
      {options.map((option) => (
        // Not `disabled`, which would stop the tooltip saying why
        <button
          key={option.value}
          class={`${option.value === value ? "is-selected" : ""} ${option.disabled ? "is-disabled" : ""}`}
          aria-disabled={option.disabled}
          {...tip(option.tip)}
          onClick={() => !option.disabled && onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

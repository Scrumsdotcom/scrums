import { useState } from "react";
import "./SortControl.css";

export interface SortOption {
  label: string;
  value?: string;
}

export interface SortControlProps {
  options?: SortOption[];
  active?: string;
  label?: string;
}

const DEFAULT_OPTIONS: SortOption[] = [
  { label: "Best match" },
  { label: "Most deployed" },
  { label: "Lowest rate" },
  { label: "Fastest ramp" },
];

export function SortControl({ options = DEFAULT_OPTIONS, active, label = "RANK BY" }: SortControlProps) {
  const opts = options.filter((o) => Boolean(o.label));
  const initial = active || opts[0]?.label || "";
  const [sel, setSel] = useState(initial);
  return (
    <div className="ds-sort" role="group" aria-label={label}>
      {label ? <span className="ds-sort__label">{label}</span> : null}
      <div className="ds-sort__set">
        {opts.map((o, i) => {
          const key = o.value || o.label;
          const isOn = (o.value || o.label) === sel;
          return (
            <button
              key={`${key}-${i}`}
              type="button"
              className={`ds-sort__btn${isOn ? " ds-sort__btn--on" : ""}`}
              aria-pressed={isOn}
              onClick={() => setSel(o.value || o.label)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import "./SegmentedMeter.css";

export interface SegmentedMeterProps {
  value?: number;
  blocks?: number;
  label?: string;
  showValue?: boolean;
}

export function SegmentedMeter({ value = 98, blocks = 10, label, showValue = true }: SegmentedMeterProps) {
  const v = Math.max(0, Math.min(100, value));
  const total = Math.max(1, Math.round(blocks));
  const filled = Math.round((v / 100) * total);
  return (
    <div
      className="ds-meter"
      role="meter"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${Math.round(v)}% match`}
    >
      <div className="ds-meter__track" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`ds-meter__block${i < filled ? " ds-meter__block--on" : ""}`} />
        ))}
      </div>
      {showValue ? (
        <span className="ds-meter__value">{label || `${Math.round(v)}% MATCH`}</span>
      ) : null}
    </div>
  );
}

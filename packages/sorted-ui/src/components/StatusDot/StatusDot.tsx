import "./StatusDot.css";

export type StatusTone = "live" | "available" | "operational" | "linked" | "idle" | "busy" | "accent";

export interface StatusDotProps {
  label?: string;
  tone?: StatusTone;
  pulse?: boolean;
}

export function StatusDot({ label = "LIVE", tone = "live", pulse = false }: StatusDotProps) {
  return (
    <span className={`ds-status ds-status--${tone}`}>
      <span className={`ds-status__dot${pulse ? " ds-status__dot--pulse" : ""}`} aria-hidden="true" />
      {label ? <span className="ds-status__label">{label}</span> : null}
    </span>
  );
}

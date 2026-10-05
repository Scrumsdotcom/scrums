import "./OperatorResultCard.css";

import type { StatusTone } from "./tones";
import { TONES } from "./tones";

export interface TelemetryStat {
  label: string;
  value: string;
}

export interface OperatorResultCardProps {
  section?: string;
  code?: string;
  status?: StatusTone;
  statusLabel?: string;
  title?: string;
  summary?: string;
  tags?: string[];
  stats?: TelemetryStat[];
  meter?: number;
  meterLabel?: string;
  price?: string;
  priceLead?: string;
  provider?: string;
  href?: string;
  action?: string;
}

const DEFAULT_TAGS = ["backend", "python", "af-cpt"];
const DEFAULT_STATS: TelemetryStat[] = [
  { label: "region", value: "af-cpt" },
  { label: "rating", value: "★ 4.8 (212)" },
  { label: "ver", value: "v2.4.0" },
];

export function OperatorResultCard({
  section = "AGENTS",
  code = "AGT-0142",
  status = "operational",
  statusLabel,
  title = "Ledger reconciliation agent",
  summary = "Reconciles multi-currency ledgers against bank feeds; flags drift and posts adjustments for review.",
  tags = DEFAULT_TAGS,
  stats = DEFAULT_STATS,
  meter = 98,
  meterLabel,
  price = "USD 4,800",
  priceLead = "from",
  provider,
  href = "#",
  action = "VIEW",
}: OperatorResultCardProps) {
  const chips = tags.filter(Boolean);
  const readouts = stats.filter((s) => Boolean(s.label) || Boolean(s.value));
  const hasMeter = typeof meter === "number" && !Number.isNaN(meter);
  const v = hasMeter ? Math.max(0, Math.min(100, meter)) : 0;
  const filled = Math.round((v / 100) * 10);
  const meterReadout = meterLabel || `${Math.round(v)}% MATCH`;
  const tone = TONES.includes(status) ? status : "operational";

  return (
    <a className="ds-opcard" href={href}>
      <div className="ds-opcard__head">
        <span className={`ds-opcard__dot ds-opcard__dot--${tone}`} aria-hidden="true" />
        <span className="ds-opcard__section">{section}</span>
        {statusLabel ? <span className="ds-opcard__status">{statusLabel}</span> : null}
        {code ? <span className="ds-opcard__code">{code}</span> : null}
      </div>

      <h3 className="ds-opcard__title">{title}</h3>
      {summary ? <p className="ds-opcard__summary">{summary}</p> : null}

      {chips.length ? (
        <div className="ds-opcard__tags">
          {chips.map((c, i) => (
            <span className="ds-opcard__tag" key={`${c}-${i}`}>
              {c}
            </span>
          ))}
        </div>
      ) : null}

      {readouts.length ? (
        <div className="ds-opcard__telemetry">
          {readouts.map((s, i) => (
            <span className="ds-opcard__stat" key={`${s.label}-${i}`}>
              {s.label ? <span className="ds-opcard__stat-label">{s.label}</span> : null}
              {s.value ? <span className="ds-opcard__stat-value">{s.value}</span> : null}
            </span>
          ))}
        </div>
      ) : null}

      {hasMeter ? (
        <div
          className="ds-opcard__meter"
          role="meter"
          aria-valuenow={Math.round(v)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={meterReadout}
        >
          <span className="ds-opcard__meter-track" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={`ds-opcard__block${i < filled ? " ds-opcard__block--on" : ""}`}
              />
            ))}
          </span>
          <span className="ds-opcard__meter-value">{meterReadout}</span>
        </div>
      ) : null}

      <div className="ds-opcard__foot">
        {price ? (
          <span className="ds-opcard__price">
            {priceLead ? <span className="ds-opcard__price-lead">{priceLead} </span> : null}
            <span className="ds-opcard__price-value">{price}</span>
          </span>
        ) : (
          <span className="ds-opcard__provider">{provider ?? ""}</span>
        )}
        <span className="ds-opcard__action">
          {action} <span aria-hidden="true">→</span>
        </span>
      </div>
    </a>
  );
}

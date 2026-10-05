import "./Stats.css";

export interface Stat {
  label: string;
  value: string;
  sub?: string;
}

export interface StatsProps {
  eyebrow?: string;
  heading?: string;
  stats?: Stat[];
}

const DEFAULT_STATS: Stat[] = [
  { label: "UPTIME", value: "99.999%", sub: "rolling 90d" },
  { label: "DEPLOYMENTS", value: "12,480", sub: "this quarter" },
  { label: "OPERATORS", value: "400+", sub: "across 5 regions" },
  { label: "MEDIAN RAMP", value: "21d", sub: "to first deploy" },
];

const pad = (i: number) => String(i + 1).padStart(2, "0");

export function Stats({ eyebrow = "+ PROOF", heading = "", stats = DEFAULT_STATS }: StatsProps) {
  return (
    <section className="ds-stats">
      {eyebrow || heading ? (
        <header className="ds-stats__head">
          {eyebrow ? <span className="ds-stats__eyebrow">{eyebrow}</span> : null}
          {heading ? <h2 className="ds-stats__title">{heading}</h2> : null}
        </header>
      ) : null}

      <div className="ds-stats__grid">
        {stats.map((s, i) => (
          <div key={`${s.label}-${i}`} className="ds-stats__cell">
            <span className="ds-stats__idx">/{pad(i)}</span>
            <span className="ds-stats__label">{s.label}</span>
            <span className="ds-stats__value">{s.value}</span>
            {s.sub ? <span className="ds-stats__sub">{s.sub}</span> : null}
            <span className="ds-stats__meter" aria-hidden="true">
              <i className="f" />
              <i className="f" />
              <i className="f" />
              <i className="f" />
              <i className="f" />
              <i />
              <i />
              <i />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

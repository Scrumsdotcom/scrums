import "./StatStrip.css";

export interface Stat {
  num: string;
  label: string;
  sub?: string;
}

export interface StatStripProps {
  stats?: Stat[];
  columns?: number;
}

const DEFAULT_STATS: Stat[] = [
  { num: "312", label: "DEPLOYS", sub: "across 23 orgs" },
  { num: "99.9%", label: "SLA", sub: "T1 committed" },
  { num: "5d", label: "RAMP", sub: "to first PR" },
  { num: "94%", label: "RETENTION", sub: "12-mo cohort" },
];

export function StatStrip({ stats = DEFAULT_STATS, columns = 4 }: StatStripProps) {
  const cells = stats.filter((s) => Boolean(s.num) || Boolean(s.label));
  const cols = Math.max(1, Math.min(6, Math.round(columns)));
  return (
    <div className="ds-statstrip" style={{ ["--ds-cols" as string]: String(cols) }}>
      {cells.map((s, i) => (
        <div className="ds-statstrip__cell" key={`${s.label}-${i}`}>
          <span className="ds-statstrip__num">{s.num}</span>
          {s.label ? <span className="ds-statstrip__label">{s.label}</span> : null}
          {s.sub ? <span className="ds-statstrip__sub">{s.sub}</span> : null}
        </div>
      ))}
    </div>
  );
}

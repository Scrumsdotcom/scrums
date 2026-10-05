import "./FilterDrawer.css";

export interface FacetOption {
  label: string;
  count?: number;
  href?: string;
  active?: boolean;
}

export interface FacetGroup {
  heading: string;
  tail?: string;
  options: FacetOption[];
  open?: boolean;
}

export interface FilterDrawerProps {
  title?: string;
  tail?: string;
  groups?: FacetGroup[];
}

const DEFAULT_GROUPS: FacetGroup[] = [
  {
    heading: "AVAILABILITY",
    tail: "3 OPTS",
    options: [
      { label: "Available now", count: 31, active: true },
      { label: "Ramp ≤ 7 days", count: 22 },
      { label: "Include busy", count: 14 },
    ],
  },
  {
    heading: "REGION",
    tail: "5 OPTS",
    options: [
      { label: "af-cpt", count: 88 },
      { label: "eu-lon", count: 64 },
      { label: "us-east", count: 51 },
      { label: "us-west", count: 33 },
      { label: "af-nbo", count: 11 },
    ],
  },
  {
    heading: "TIER · SLA",
    tail: "3 OPTS",
    options: [
      { label: "T1 · 99.999%", count: 19 },
      { label: "T2 · 99.95%", count: 47 },
      { label: "T3 · best-effort", count: 28 },
    ],
  },
];

export function FilterDrawer({
  title = "Filters",
  tail = "247 RESULTS",
  groups = DEFAULT_GROUPS,
}: FilterDrawerProps) {
  const blocks = groups.filter(
    (g) => Boolean(g.heading) && g.options.some((o) => Boolean(o.label)),
  );
  return (
    <aside className="ds-drawer" aria-label={title || "Filters"}>
      <header className="ds-drawer__head">
        <h2 className="ds-drawer__title">{title}</h2>
        {tail ? <span className="ds-drawer__tail">{tail}</span> : null}
      </header>

      <div className="ds-drawer__groups">
        {blocks.map((g, gi) => {
          const opts = g.options.filter((o) => Boolean(o.label));
          return (
            <details className="ds-drawer__group" key={`${g.heading}-${gi}`} open={g.open !== false}>
              <summary className="ds-drawer__summary">
                <span className="ds-drawer__heading">{g.heading}</span>
                {g.tail ? <span className="ds-drawer__group-tail">{g.tail}</span> : null}
                <span className="ds-drawer__caret" aria-hidden="true">
                  ›
                </span>
              </summary>
              <ul className="ds-drawer__list">
                {opts.map((o, oi) => (
                  <li className="ds-drawer__row" key={`${o.label}-${oi}`}>
                    {o.href ? (
                      <a className="ds-drawer__opt" href={o.href}>
                        <span
                          className="ds-drawer__box"
                          data-on={o.active ? "true" : "false"}
                          aria-hidden="true"
                        />
                        <span className="ds-drawer__label">{o.label}</span>
                        {o.count != null ? <span className="ds-drawer__count">{o.count}</span> : null}
                      </a>
                    ) : (
                      <label className="ds-drawer__opt">
                        <input
                          className="ds-drawer__input"
                          type="checkbox"
                          defaultChecked={o.active}
                        />
                        <span className="ds-drawer__box" aria-hidden="true" />
                        <span className="ds-drawer__label">{o.label}</span>
                        {o.count != null ? <span className="ds-drawer__count">{o.count}</span> : null}
                      </label>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </aside>
  );
}

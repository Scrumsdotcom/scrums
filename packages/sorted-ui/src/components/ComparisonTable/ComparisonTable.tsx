import "./ComparisonTable.css";

export interface ComparisonRow {
  feature: string;
  a?: string;
  b?: string;
  c?: string;
}

export interface ComparisonTableProps {
  eyebrow?: string;
  title?: string;
  colFeature?: string;
  colA?: string;
  colB?: string;
  colC?: string;
  rows?: ComparisonRow[];
  leadIndex?: number;
}

const DEFAULT_ROWS: ComparisonRow[] = [
  { feature: "Ramp time", a: "Days", b: "Weeks", c: "Months" },
  { feature: "One operated surface", a: "yes", b: "no", c: "no" },
  { feature: "Telemetry across SDLC", a: "yes", b: "no", c: "no" },
  { feature: "Multi-region pods", a: "5 regions", b: "Single", c: "Single" },
  { feature: "AI agents embedded", a: "yes", b: "no", c: "no" },
  { feature: "Coordination overhead", a: "Operated", b: "High", c: "High" },
];

function Cell({ value, lead }: { value?: string; lead?: boolean }) {
  const v = (value ?? "").trim();
  const cls = lead ? "ds-cmp__cell-lead" : undefined;
  if (v.toLowerCase() === "yes") {
    return (
      <td className={cls}>
        <span className="ds-cmp__yes" aria-label="Included">
          ✓ Yes
        </span>
      </td>
    );
  }
  if (v.toLowerCase() === "no") {
    return (
      <td className={cls}>
        <span className="ds-cmp__no" aria-label="Not included">
          — No
        </span>
      </td>
    );
  }
  return <td className={cls}>{v || "—"}</td>;
}

export function ComparisonTable({
  eyebrow = "[SEC-08] COMPARATIVE READOUT",
  title = "One operated surface vs. the alternatives",
  colFeature = "Capability",
  colA = "Scrums.com",
  colB = "In-house hire",
  colC = "Dev agency",
  rows = DEFAULT_ROWS,
  leadIndex = 0,
}: ComparisonTableProps) {
  const body = rows.filter((r) => Boolean(r.feature));
  const cols = [colA, colB, colC];
  return (
    <section className="ds-cmp">
      <div className="ds-cmp__inner">
        {eyebrow || title ? (
          <div className="ds-cmp__head">
            {eyebrow ? <span className="ds-cmp__eyebrow">{eyebrow}</span> : null}
            {title ? <h2 className="ds-cmp__title">{title}</h2> : null}
          </div>
        ) : null}
        <div className="ds-cmp__scroll">
          <table className="ds-cmp__table">
            <thead>
              <tr>
                <th scope="col">{colFeature}</th>
                {cols.map((c, ci) =>
                  c ? (
                    <th
                      key={`col-${ci}`}
                      scope="col"
                      className={ci === leadIndex ? "ds-cmp__lead" : undefined}
                    >
                      {c}
                    </th>
                  ) : null,
                )}
              </tr>
            </thead>
            <tbody>
              {body.map((r, i) => {
                const vals = [r.a, r.b, r.c];
                return (
                  <tr key={`${r.feature}-${i}`}>
                    <th scope="row" className="ds-cmp__col-feature">
                      {r.feature}
                    </th>
                    {cols.map((c, ci) =>
                      c ? <Cell key={`cell-${ci}`} value={vals[ci]} lead={ci === leadIndex} /> : null,
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

import "./TelemetryTable.css";

export interface TelemetryRow {
  cells: string[];
  status?: "ok" | "warn" | "idle";
}

export interface TelemetryTableProps {
  caption?: string;
  columns?: string[];
  rows?: TelemetryRow[];
}

const DEFAULT_COLUMNS = ["Sector", "System", "Outcome", "Span", "Status"];
const DEFAULT_ROWS: TelemetryRow[] = [
  { cells: ["Fintech", "Ledger core", "Cut p99 380ms → 90ms", "14 wk", "SHIPPED"], status: "ok" },
  { cells: ["Health", "Claims pipeline", "0-downtime cutover", "9 wk", "SHIPPED"], status: "ok" },
  { cells: ["Logistics", "Routing engine", "Throughput +3.1×", "11 wk", "OPERATING"], status: "ok" },
];

export function TelemetryTable({
  caption,
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
}: TelemetryTableProps) {
  const cols = columns.filter((c) => Boolean(c));
  const body = rows.filter((r) => r.cells.some((c) => Boolean(c)));
  return (
    <div className="ds-ttable__wrap">
      <table className="ds-ttable">
        {caption ? <caption className="ds-ttable__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th className="ds-ttable__th" scope="col" key={`${c}-${i}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr className="ds-ttable__tr" key={ri}>
              {cols.map((_, ci) => {
                const value = r.cells[ci] ?? "";
                const isLast = ci === cols.length - 1;
                const cls =
                  "ds-ttable__td" + (isLast && r.status ? ` ds-ttable__td--${r.status}` : "");
                return (
                  <td className={cls} key={ci}>
                    {isLast && r.status ? (
                      <span className="ds-ttable__status">
                        <span className="ds-ttable__dot" aria-hidden="true" />
                        {value}
                      </span>
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

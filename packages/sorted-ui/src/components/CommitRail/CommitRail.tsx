import "./CommitRail.css";

export type CommitTone = "ok" | "active" | "queued" | "warn";

export interface CommitEntry {
  mark: string;
  message: string;
  time?: string;
  tone?: CommitTone;
  href?: string;
}

export interface CommitRailProps {
  index?: string;
  heading?: string;
  tail?: string;
  entries?: CommitEntry[];
}

const DEFAULT_ENTRIES: CommitEntry[] = [
  { mark: "a1f3c9", message: "Routing engine throughput +3.1×", time: "21m ago", tone: "ok" },
  { mark: "7e02b4", message: "Claims pipeline 0-downtime cutover", time: "2h ago", tone: "ok" },
  { mark: "DEP-014", message: "Ledger core p99 380ms → 90ms", time: "deploying", tone: "active" },
  { mark: "c84d10", message: "Match-meter recalibration queued", time: "queued", tone: "queued" },
];

export function CommitRail({
  index = "+ 06",
  heading = "Recent activity",
  tail = "DEPLOY LOG",
  entries = DEFAULT_ENTRIES,
}: CommitRailProps) {
  const rows = entries.filter((e) => Boolean(e.mark) || Boolean(e.message));
  return (
    <section className="ds-rail">
      <header className="ds-rail__head">
        {index ? <span className="ds-rail__index">{index}</span> : null}
        <h2 className="ds-rail__title">{heading}</h2>
        {tail ? <span className="ds-rail__tail">{tail}</span> : null}
      </header>

      <ol className="ds-rail__list">
        {rows.map((e, i) => {
          const tone = e.tone ?? "ok";
          const inner = (
            <>
              <span className="ds-rail__node" aria-hidden="true">
                <span className={`ds-rail__dot ds-rail__dot--${tone}`} />
              </span>
              <span className="ds-rail__mark">{e.mark}</span>
              <span className="ds-rail__message">{e.message}</span>
              {e.time ? <span className="ds-rail__time">{e.time}</span> : null}
            </>
          );
          return (
            <li className="ds-rail__row" key={`${e.mark}-${i}`}>
              {e.href ? (
                <a className="ds-rail__link" href={e.href}>
                  {inner}
                </a>
              ) : (
                <div className="ds-rail__entry">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

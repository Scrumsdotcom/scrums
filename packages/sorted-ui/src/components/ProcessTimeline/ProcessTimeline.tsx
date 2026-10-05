import "./ProcessTimeline.css";

export interface DeployPhase {
  name: string;
  status?: string;
  readout?: string;
  meta?: string;
}

export interface ProcessTimelineProps {
  eyebrow?: string;
  summary?: string;
  steps?: DeployPhase[];
}

const DEFAULT_STEPS: DeployPhase[] = [
  { name: "SCOPE", status: "DONE", readout: "BOTTLENECK MAPPED · CAPACITY READ", meta: "T+0–3d" },
  { name: "EMBED", status: "DONE", readout: "OPERATORS RAMPED · ON SURFACE", meta: "T+1w" },
  { name: "OPERATE", status: "ACTIVE", readout: "PODS LIVE · TELEMETRY STREAMING", meta: "T+2w" },
  { name: "SCALE", status: "QUEUED", readout: "+REGIONS · +AGENTS · 0 OVERHEAD", meta: "ONGOING" },
];

function stateClass(status?: string): string {
  const s = (status ?? "").toLowerCase();
  if (s.includes("done") || s.includes("complete")) return "ds-timeline__status--done";
  if (s.includes("active") || s.includes("live")) return "ds-timeline__status--active";
  return "ds-timeline__status--queued";
}

export function ProcessTimeline({
  eyebrow = "[SEC-05] DEPLOY SEQUENCE // FIELD OPS",
  summary = "PHASE 3/4 · ACTIVE",
  steps = DEFAULT_STEPS,
}: ProcessTimelineProps) {
  const items = steps.filter((s) => Boolean(s.name));
  return (
    <section className="ds-timeline">
      <div className="ds-timeline__inner">
        {eyebrow || summary ? (
          <div className="ds-timeline__head">
            {eyebrow ? <span className="ds-timeline__eyebrow">{eyebrow}</span> : null}
            {summary ? <span className="ds-timeline__summary">{summary}</span> : null}
          </div>
        ) : null}
        <ol className="ds-timeline__steps">
          {items.map((s, i) => (
            <li className="ds-timeline__step" key={`${s.name}-${i}`}>
              <div className="ds-timeline__top">
                <span className="ds-timeline__id">PHASE-{String(i + 1).padStart(2, "0")}</span>
                {s.status ? (
                  <span className={`ds-timeline__status ${stateClass(s.status)}`}>
                    <span className="ds-timeline__dot" aria-hidden="true" />
                    {s.status}
                  </span>
                ) : null}
              </div>
              <span className="ds-timeline__node" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="ds-timeline__name">{s.name}</h3>
              {s.readout ? <p className="ds-timeline__readout">{s.readout}</p> : null}
              {s.meta ? <span className="ds-timeline__meta">{s.meta}</span> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import "./CapabilityMatrix.css";

export interface MatrixRow {
  name: string;
  capability: string;
  scale: string;
  sla: string;
  regions: string;
}

export interface CapabilityMatrixProps {
  index?: string;
  heading?: string;
  tail?: string;
  cols?: [string, string, string, string];
  rows?: MatrixRow[];
}

const DEFAULT_ROWS: MatrixRow[] = [
  { name: "Talent", capability: "Vetted operators, embedded", scale: "400+ ops", sla: "21d ramp", regions: "af-cpt +4" },
  { name: "Delivery", capability: "Managed engineering pods", scale: "120 pods", sla: "99.9%", regions: "5 regions" },
  { name: "Systems", capability: "Orchestrated infra & SDLC", scale: "12,480 deploys", sla: "99.999%", regions: "us·eu·af" },
];

const pad = (i: number) => String(i + 1).padStart(2, "0");

export function CapabilityMatrix({
  index = "+ 01",
  heading = "Capability matrix",
  tail = "SEOP // CAPABILITY",
  cols = ["Capability", "Scale", "SLA", "Regions"],
  rows = DEFAULT_ROWS,
}: CapabilityMatrixProps) {
  return (
    <section className="ds-matrix">
      <header className="ds-matrix__head">
        <span className="ds-matrix__index">{index}</span>
        <h2 className="ds-matrix__title">{heading}</h2>
        <span className="ds-matrix__tail">{tail}</span>
      </header>

      <div className="ds-matrix__grid" role="table">
        <div className="ds-matrix__row ds-matrix__row--head" role="row">
          <span className="ds-matrix__cell ds-matrix__cell--name" role="columnheader">
            System
          </span>
          {cols.map((c) => (
            <span key={c} className="ds-matrix__cell" role="columnheader">
              {c}
            </span>
          ))}
        </div>

        {rows.map((r, i) => (
          <div key={`${r.name}-${i}`} className="ds-matrix__row" role="row">
            <span className="ds-matrix__cell ds-matrix__cell--name" role="cell">
              <span className="ds-matrix__rowidx">/{pad(i)}</span>
              {r.name}
            </span>
            <span className="ds-matrix__cell" role="cell">
              <span className="ds-matrix__k">{cols[0]}</span>
              {r.capability}
            </span>
            <span className="ds-matrix__cell ds-matrix__cell--num" role="cell">
              <span className="ds-matrix__k">{cols[1]}</span>
              {r.scale}
            </span>
            <span className="ds-matrix__cell ds-matrix__cell--num" role="cell">
              <span className="ds-matrix__k">{cols[2]}</span>
              {r.sla}
            </span>
            <span className="ds-matrix__cell ds-matrix__cell--num" role="cell">
              <span className="ds-matrix__k">{cols[3]}</span>
              {r.regions}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

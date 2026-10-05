import "./CaseStudyGrid.css";

export interface CaseEntry {
  ref?: string;
  sector?: string;
  title: string;
  metricValue?: string;
  metricLabel?: string;
  field?: string;
  linkLabel?: string;
  linkHref?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export interface CaseStudyGridProps {
  eyebrow?: string;
  summary?: string;
  items?: CaseEntry[];
}

const DEFAULT_ITEMS: CaseEntry[] = [
  { ref: "CASE-01", sector: "FINTECH · SERIES B", title: "Four vendors retired, one surface", metricValue: "−63%", metricLabel: "Coordination overhead", field: "af-cpt · eu-lon · T+90d", linkLabel: "OPEN ▸", linkHref: "#" },
  { ref: "CASE-02", sector: "LOGISTICS", title: "Production in week two", metricValue: "14d", metricLabel: "To first deploy", field: "us-east · T+14d", linkLabel: "OPEN ▸", linkHref: "#" },
  { ref: "CASE-03", sector: "HEALTHTECH", title: "Three regions, zero overhead", metricValue: "3×", metricLabel: "Regional throughput", field: "af-nbo · eu-lon · us-west", linkLabel: "OPEN ▸", linkHref: "#" },
];

export function CaseStudyGrid({
  eyebrow = "[SEC-06] OPERATED OUTCOMES // FIELD RESULTS",
  summary = "3 SHIPPED · 0 ROLLED BACK",
  items = DEFAULT_ITEMS,
}: CaseStudyGridProps) {
  const cards = items.filter((c) => Boolean(c.title));
  return (
    <section className="ds-cases">
      <div className="ds-cases__inner">
        {eyebrow || summary ? (
          <div className="ds-cases__head">
            {eyebrow ? <span className="ds-cases__eyebrow">{eyebrow}</span> : null}
            {summary ? <span className="ds-cases__summary">{summary}</span> : null}
          </div>
        ) : null}
        <div className="ds-cases__grid">
          {cards.map((c, i) => {
            const inner = (
              <>
                {c.imageSrc ? (
                  <img className="ds-cases__media" src={c.imageSrc} alt={c.imageAlt || c.title} loading="lazy" />
                ) : null}
                <div className="ds-cases__body">
                  <div className="ds-cases__top">
                    <span className="ds-cases__ref">{c.ref || `CASE-${String(i + 1).padStart(2, "0")}`}</span>
                    {c.sector ? <span className="ds-cases__sector">{c.sector}</span> : null}
                  </div>
                  <h3 className="ds-cases__card-title">{c.title}</h3>
                  {c.metricValue ? (
                    <div className="ds-cases__metric">
                      <span className="ds-cases__metric-value">{c.metricValue}</span>
                      {c.metricLabel ? <span className="ds-cases__metric-label">{c.metricLabel}</span> : null}
                    </div>
                  ) : null}
                  {c.field ? (
                    <span className="ds-cases__field">
                      <span className="ds-cases__dot" aria-hidden="true" />
                      {c.field}
                    </span>
                  ) : null}
                  {c.linkLabel ? <span className="ds-cases__link">{c.linkLabel}</span> : null}
                </div>
              </>
            );
            return c.linkHref ? (
              <a className="ds-cases__card" href={c.linkHref} key={`${c.title}-${i}`}>
                {inner}
              </a>
            ) : (
              <article className="ds-cases__card" key={`${c.title}-${i}`}>
                {inner}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

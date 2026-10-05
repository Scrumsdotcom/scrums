import "./Hero.css";

export interface HeroMetric {
  label: string;
  value: string;
}

export interface HeroProps {
  eyebrowTag?: string;
  eyebrow?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  sub?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  panelTitle?: string;
  status?: string;
  metrics?: HeroMetric[];
}

const DEFAULT_METRICS: HeroMetric[] = [
  { label: "UPTIME", value: "99.999%" },
  { label: "DEPLOYMENTS", value: "12,480" },
  { label: "REGIONS", value: "5" },
  { label: "MEDIAN RAMP", value: "21d" },
];

export function Hero({
  eyebrowTag = "SEOP",
  eyebrow = "The Software Engineering Orchestration Platform.",
  line1 = "Software",
  line2 = "Engineering.",
  line3 = "Sorted.",
  sub = "Talent, delivery, and intelligence operated as one system — observe, orchestrate, deploy.",
  primaryLabel = "Deploy Scrums.com",
  primaryHref = "#",
  secondaryLabel = "$ scrums deploy --docs",
  secondaryHref = "#",
  panelTitle = "SEOP / TELEMETRY",
  status = "LIVE",
  metrics = DEFAULT_METRICS,
}: HeroProps) {
  return (
    <section className="ds-hero">
      <span className="ds-hero__bracket ds-hero__bracket--tl" aria-hidden="true" />
      <span className="ds-hero__bracket ds-hero__bracket--br" aria-hidden="true" />
      <span className="ds-hero__coord ds-hero__coord--a" aria-hidden="true">+ SECTOR 04</span>
      <span className="ds-hero__coord ds-hero__coord--b" aria-hidden="true">+ NODE A17</span>

      <div className="ds-hero__inner">
        <div className="ds-hero__copy">
          <span className="ds-hero__eyebrow">
            <span className="ds-hero__tag">{eyebrowTag}</span>
            {eyebrow}
          </span>
          <h1 className="ds-hero__headline">
            <span className="ds-hero__line ds-hero__line--light">{line1}</span>
            <span className="ds-hero__line">{line2}</span>
            <span className="ds-hero__line ds-hero__line--accent">
              {line3}
              <span className="ds-hero__cursor" aria-hidden="true" />
            </span>
          </h1>
          {sub ? <p className="ds-hero__sub">{sub}</p> : null}
          <div className="ds-hero__cta">
            <a className="ds-hero__btn ds-hero__btn--primary" href={primaryHref}>
              {primaryLabel} →
            </a>
            {secondaryLabel ? (
              <a className="ds-hero__btn ds-hero__btn--ghost" href={secondaryHref}>
                {secondaryLabel}
              </a>
            ) : null}
          </div>
        </div>

        <aside className="ds-hero__panel">
          <div className="ds-hero__panel-head">
            <span>{panelTitle}</span>
            <span className="ds-hero__live">
              <span className="ds-hero__dot" aria-hidden="true" />
              {status}
            </span>
          </div>
          <div className="ds-hero__metrics">
            {metrics.map((m, i) => (
              <div key={`${m.label}-${i}`} className="ds-hero__metric">
                <span className="ds-hero__metric-label">{m.label}</span>
                <span className="ds-hero__metric-value">{m.value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

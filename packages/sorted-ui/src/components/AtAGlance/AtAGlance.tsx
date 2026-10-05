import "./AtAGlance.css";

export interface AtAGlanceProps {
  label?: string;
  summary?: string;
  price?: string;
  rating?: string;
  availability?: string;
  trust?: string;
}

export function AtAGlance({
  label = "summary",
  summary = "A deployable, SLA-backed AI agent on Scrums.com — priced, versioned and buyable now.",
  price = "USD 4,800",
  rating = "4.8",
  availability = "available now",
  trust = "vetted by Scrums.com",
}: AtAGlanceProps) {
  return (
    <section className="ds-glance" data-agent-summary aria-label="At a glance">
      <span className="ds-glance__label">{label}</span>
      <span className="ds-glance__summary" data-field="summary">
        {summary}
      </span>
      <span className="ds-glance__readouts">
        {price ? (
          <span className="ds-glance__price" data-field="price">
            {price}
          </span>
        ) : null}
        {rating ? (
          <>
            <span className="ds-glance__sep" aria-hidden="true">
              ·
            </span>
            <span data-field="rating">★ {rating}</span>
          </>
        ) : null}
        {availability ? (
          <>
            <span className="ds-glance__sep" aria-hidden="true">
              ·
            </span>
            <span className="ds-glance__avail" data-field="availability">
              ● {availability}
            </span>
          </>
        ) : null}
        {trust ? (
          <>
            <span className="ds-glance__sep" aria-hidden="true">
              ·
            </span>
            <span className="ds-glance__trust" data-field="trust">
              {trust}
            </span>
          </>
        ) : null}
      </span>
    </section>
  );
}

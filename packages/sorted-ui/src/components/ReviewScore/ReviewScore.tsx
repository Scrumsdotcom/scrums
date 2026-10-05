import "./ReviewScore.css";

export interface ReviewScoreProps {
  value?: number;
  best?: number;
  source?: string;
  sourceUrl?: string;
  details?: boolean;
}

export function ReviewScore({
  value = 4.8,
  best = 5,
  source = "GoodFirms",
  sourceUrl = "#",
  details = true,
}: ReviewScoreProps) {
  const safe = Math.max(0, Math.min(best, value));
  const pct = best > 0 ? (safe / best) * 100 : 0;

  const stars = (
    <span className="ds-review__stars" aria-hidden="true">
      <span className="ds-review__stars-empty">★★★★★</span>
      <span className="ds-review__stars-fill" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  );

  const summary = (
    <>
      {stars}
      <span className="ds-review__value">{safe.toFixed(1)}</span>
    </>
  );

  if (!details) {
    return (
      <span className="ds-review" aria-label={`Rated ${safe.toFixed(1)} out of ${best}`}>
        {summary}
      </span>
    );
  }

  return (
    <details className="ds-review ds-review--toggle">
      <summary className="ds-review__summary">
        {summary}
        <span className="ds-review__more">Reviews ▾</span>
      </summary>
      <div className="ds-review__panel">
        <p className="ds-review__line">
          Rated{" "}
          <span className="ds-review__line-strong">
            {safe.toFixed(1)} / {best}
          </span>{" "}
          by clients on {source}.
        </p>
        <a className="ds-review__link" href={sourceUrl} target="_blank" rel="noopener noreferrer">
          Read verified reviews on {source} →
        </a>
      </div>
    </details>
  );
}

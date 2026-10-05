import "./PlanCard.css";

export interface PlanCardProps {
  name: string;
  tagline?: string;
  monthlyPrice: string;
  annualPrice: string;
  period?: string;
  monthlySub?: string;
  annualSub?: string;
  defaultBilling?: "monthly" | "annual";
  terms?: string;
  ctaLabel: string;
  ctaHref?: string;
  awsLabel?: string;
  awsHref?: string;
  features: string[];
  featured?: boolean;
  badge?: string;
}

export function PlanCard({
  name,
  tagline,
  monthlyPrice,
  annualPrice,
  period = "/mo",
  monthlySub,
  annualSub,
  defaultBilling = "annual",
  terms,
  ctaLabel,
  ctaHref = "#",
  awsLabel,
  awsHref = "#",
  features,
  featured = false,
  badge,
}: PlanCardProps) {
  const initPrice = defaultBilling === "annual" ? annualPrice : monthlyPrice;
  const initSub = defaultBilling === "annual" ? annualSub : monthlySub;
  return (
    <div className={`ds-plancard${featured ? " ds-plancard--featured" : ""}`}>
      {featured && badge ? <div className="ds-plancard__badge">{badge}</div> : null}
      <div className="ds-plancard__body">
        <div className="ds-plancard__head">
          <span className="ds-plancard__diamond" aria-hidden="true" />
          <h3 className="ds-plancard__name">{name}</h3>
        </div>
        {tagline ? <div className="ds-plancard__tagline">{tagline}</div> : null}

        <div className="ds-plancard__amount">
          <span
            className="ds-plancard__price"
            data-price-monthly={monthlyPrice}
            data-price-annual={annualPrice}
          >
            {initPrice}
          </span>
          <span className="ds-plancard__period">{period}</span>
        </div>
        <div
          className="ds-plancard__sub"
          data-sub-monthly={monthlySub ?? ""}
          data-sub-annual={annualSub ?? ""}
        >
          {initSub}
        </div>

        <div className="ds-plancard__actions">
          <a className="ds-plancard__cta" href={ctaHref}>
            {ctaLabel} →
          </a>
          {awsLabel ? (
            <a
              className="ds-plancard__aws"
              href={awsHref}
              data-label-only="true"
              {...(awsHref.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className="ds-plancard__aws-mark" aria-hidden="true">
                aws
              </span>
              {awsLabel}
            </a>
          ) : null}
        </div>

        {terms ? (
          <div className="ds-plancard__terms">
            <span className="ds-plancard__terms-k">Payment</span>
            <span className="ds-plancard__terms-v">{terms}</span>
          </div>
        ) : null}

        <ul className="ds-plancard__features">
          {features.map((f) => (
            <li key={f}>
              <span className="ds-plancard__check" aria-hidden="true">
                ✓
              </span>
              <span className="ds-plancard__feature-text">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

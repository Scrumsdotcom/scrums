import "./Pricing.css";

export interface Plan {
  name: string;
  price: string;
  period?: string;
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
  featured?: boolean;
}

export interface PricingProps {
  index?: string;
  heading?: string;
  tail?: string;
  plans?: Plan[];
}

const DEFAULT_PLANS: Plan[] = [
  {
    name: "Pod",
    price: "$4,000",
    period: "/mo",
    features: ["1 managed pod", "21d median ramp", "Single region", "Weekly telemetry"],
    ctaLabel: "Deploy",
    ctaHref: "#",
  },
  {
    name: "Squadron",
    price: "$18,000",
    period: "/mo",
    features: ["Up to 5 pods", "Multi-region routing", "99.9% SLA", "Daily telemetry", "Dedicated orchestrator"],
    ctaLabel: "Deploy",
    ctaHref: "#",
    featured: true,
  },
  {
    name: "Fleet",
    price: "Custom",
    period: "",
    features: ["Unlimited pods", "5 regions", "99.999% SLA", "Real-time telemetry", "SEOP integration"],
    ctaLabel: "Contact",
    ctaHref: "#",
  },
];

const pad = (i: number) => String(i + 1).padStart(2, "0");

export function Pricing({
  index = "+ 06",
  heading = "Deployment tiers",
  tail = "SEOP // PRICING",
  plans = DEFAULT_PLANS,
}: PricingProps) {
  return (
    <section className="ds-price">
      <header className="ds-price__head">
        <span className="ds-price__index">{index}</span>
        <h2 className="ds-price__title">{heading}</h2>
        <span className="ds-price__tail">{tail}</span>
      </header>

      <div className="ds-price__grid">
        {plans.map((p, i) => (
          <div key={`${p.name}-${i}`} className={`ds-price__plan${p.featured ? " is-featured" : ""}`}>
            <div className="ds-price__plan-top">
              <span className="ds-price__idx">/{pad(i)}</span>
              <span className="ds-price__name">{p.name}</span>
            </div>
            <div className="ds-price__amount">
              <span className="ds-price__value">{p.price}</span>
              {p.period ? <span className="ds-price__period">{p.period}</span> : null}
            </div>
            <ul className="ds-price__features">
              {p.features.map((f) => (
                <li key={f}>
                  <span className="ds-price__check" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <a className="ds-price__cta" href={p.ctaHref ?? "#"}>
              {p.ctaLabel} →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

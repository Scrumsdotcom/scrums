import type { FormEvent } from "react";
import type { CtaProof } from "../CtaCentered/CtaCentered";
import "./CtaCommandStrip.css";

export interface CtaCommandStripProps {
  eyebrow?: string;
  headline?: string;
  sub?: string;
  placeholder?: string;
  ctaLabel?: string;
  action?: string;
  proof?: CtaProof;
}

export function CtaCommandStrip({
  eyebrow = "[SEC-07] DEPLOY // DELIVERY",
  headline = "Struggling with delivery bottlenecks?",
  sub = "Deploy an orchestrated engineering system — talent, delivery, and intelligence on one operated surface.",
  placeholder = "name@company.com",
  ctaLabel = "Deploy",
  action = "",
  proof,
}: CtaCommandStripProps) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!action) e.preventDefault();
  };

  return (
    <section className="ds-cta">
      <span className="ds-cta__bracket ds-cta__bracket--tl" aria-hidden="true" />
      <span className="ds-cta__bracket ds-cta__bracket--br" aria-hidden="true" />
      <span className="ds-cta__coord" aria-hidden="true">
        + SECTOR 04
      </span>

      <div className="ds-cta__inner">
        <div className="ds-cta__copy">
          <span className="ds-cta__eyebrow">{eyebrow}</span>
          <h2 className="ds-cta__headline">{headline}</h2>
          {sub ? <p className="ds-cta__sub">{sub}</p> : null}
          {proof?.quote ? (
            <figure className="ds-cta__proof">
              <blockquote className="ds-cta__proof-quote">“{proof.quote}”</blockquote>
              {proof.by ? (
                <figcaption className="ds-cta__proof-by">{proof.by}</figcaption>
              ) : null}
            </figure>
          ) : proof?.fact ? (
            <div className="ds-cta__proof">
              <span className="ds-cta__proof-fact">{proof.fact}</span>
            </div>
          ) : null}
        </div>

        <form
          className="ds-cta__form"
          action={action || undefined}
          method="get"
          onSubmit={onSubmit}
        >
          <input
            className="ds-cta__input"
            type="email"
            name="email"
            required
            placeholder={placeholder}
            aria-label="Work email"
          />
          <button className="ds-cta__btn" type="submit">
            {ctaLabel} →
          </button>
        </form>
      </div>
    </section>
  );
}

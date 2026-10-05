import "./CtaCentered.css";

export interface CtaProof {
  quote?: string;
  by?: string;
  fact?: string;
}

export interface CtaCenteredProps {
  eyebrow?: string;
  showDot?: boolean;
  title?: string;
  sub?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  note?: string;
  proof?: CtaProof;
}

export function CtaCentered({
  eyebrow = "SYSTEM READY · AWAITING DEPLOY",
  showDot = true,
  title = "Deploy Scrums.com",
  sub = "Talent, delivery, and intelligence operated as one system. Observe, orchestrate, deploy — on one surface.",
  primaryLabel = "Deploy Scrums.com",
  primaryHref = "#",
  secondaryLabel = "$ scrums deploy --docs",
  secondaryHref = "#",
  note = "NO CARD · 5 REGIONS · UPTIME 99.999%",
  proof,
}: CtaCenteredProps) {
  return (
    <section className="ds-ctac">
      <span className="ds-ctac__bracket ds-ctac__bracket--tl" aria-hidden="true" />
      <span className="ds-ctac__bracket ds-ctac__bracket--br" aria-hidden="true" />
      <div className="ds-ctac__inner">
        {eyebrow ? (
          <span className="ds-ctac__eyebrow">
            {showDot ? <span className="ds-ctac__dot" aria-hidden="true" /> : null}
            {eyebrow}
          </span>
        ) : null}
        <h2 className="ds-ctac__title">{title}</h2>
        {sub ? <p className="ds-ctac__sub">{sub}</p> : null}
        <div className="ds-ctac__actions">
          <a className="ds-ctac__btn ds-ctac__btn--primary" href={primaryHref}>
            {primaryLabel} →
          </a>
          {secondaryLabel ? (
            <a className="ds-ctac__btn ds-ctac__btn--ghost" href={secondaryHref}>
              {secondaryLabel}
            </a>
          ) : null}
        </div>
        {note ? <span className="ds-ctac__note">{note}</span> : null}
        {proof?.quote ? (
          <figure className="ds-ctac__proof">
            <blockquote className="ds-ctac__proof-quote">“{proof.quote}”</blockquote>
            {proof.by ? (
              <figcaption className="ds-ctac__proof-by">{proof.by}</figcaption>
            ) : null}
          </figure>
        ) : proof?.fact ? (
          <div className="ds-ctac__proof">
            <span className="ds-ctac__proof-fact">{proof.fact}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

import type { CtaProof } from "../CtaCentered/CtaCentered";
import "./CtaSplit.css";

export interface CtaSplitProps {
  aEyebrow: string;
  aTitle: string;
  aBody: string;
  aCtaLabel: string;
  aCtaHref: string;
  aProof?: CtaProof;
  bEyebrow: string;
  bTitle: string;
  bBody: string;
  bCtaLabel: string;
  bCtaHref: string;
}

export function CtaSplit({
  aEyebrow,
  aTitle,
  aBody,
  aCtaLabel,
  aCtaHref,
  aProof,
  bEyebrow,
  bTitle,
  bBody,
  bCtaLabel,
  bCtaHref,
}: CtaSplitProps) {
  return (
    <div className="ds-ctasplit">
      <div className="ds-ctasplit__panel ds-ctasplit__panel--blue">
        <div className="ds-ctasplit__grid" aria-hidden="true" />
        <div className="ds-ctasplit__inner">
          <div className="ds-ctasplit__eyebrow ds-ctasplit__eyebrow--on">{aEyebrow}</div>
          <h3 className="ds-ctasplit__title ds-ctasplit__title--on">{aTitle}</h3>
          <p className="ds-ctasplit__body ds-ctasplit__body--on">{aBody}</p>
          <a className="ds-ctasplit__cta ds-ctasplit__cta--white" href={aCtaHref}>
            {aCtaLabel}
          </a>
          {aProof?.quote ? (
            <figure className="ds-ctasplit__proof">
              <blockquote className="ds-ctasplit__proof-quote">“{aProof.quote}”</blockquote>
              {aProof.by ? (
                <figcaption className="ds-ctasplit__proof-by">{aProof.by}</figcaption>
              ) : null}
            </figure>
          ) : aProof?.fact ? (
            <div className="ds-ctasplit__proof">
              <span className="ds-ctasplit__proof-fact">{aProof.fact}</span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="ds-ctasplit__panel ds-ctasplit__panel--light">
        <div className="ds-ctasplit__inner">
          <div className="ds-ctasplit__eyebrow ds-ctasplit__eyebrow--ink">{bEyebrow}</div>
          <h3 className="ds-ctasplit__title">{bTitle}</h3>
          <p className="ds-ctasplit__body">{bBody}</p>
          <a className="ds-ctasplit__cta ds-ctasplit__cta--ink" href={bCtaHref}>
            {bCtaLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

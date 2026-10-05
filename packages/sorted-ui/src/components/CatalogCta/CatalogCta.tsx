import type { CtaProof } from "../CtaCentered/CtaCentered";
import "./CatalogCta.css";

export interface CatalogDemandItem {
  label: string;
  count?: string | number | null;
}

export interface CatalogDemandGroup {
  label: string;
  items: CatalogDemandItem[];
}

export interface CatalogCtaAction {
  label: string;
  href: string;
}

export interface CatalogCtaProps {
  eyebrow: string;
  title: string;
  titleAccent?: string | null;
  body: string;
  primary: CatalogCtaAction;
  secondary?: CatalogCtaAction | null;
  demandEyebrow?: string;
  demandNote?: string | null;
  demandGroups?: CatalogDemandGroup[];
  proof?: CtaProof;
}

export function CatalogCta({
  eyebrow,
  title,
  titleAccent,
  body,
  primary,
  secondary,
  demandEyebrow = "Popular // Catalog",
  demandNote,
  demandGroups = [],
  proof,
}: CatalogCtaProps) {
  return (
    <section className="ds-catalogcta">
      <div className="ds-catalogcta__inner">
        <div className="ds-catalogcta__command">
          <div className="ds-catalogcta__eyebrow">
            <span className="ds-catalogcta__plus" aria-hidden="true">+</span> {eyebrow}
          </div>
          <h2 className="ds-catalogcta__title">
            {title}
            {titleAccent ? (
              <>
                <br />
                <span className="ds-catalogcta__title-accent">{titleAccent}</span>
              </>
            ) : null}
          </h2>
          <p className="ds-catalogcta__body">{body}</p>
          <div className="ds-catalogcta__actions">
            <a className="ds-catalogcta__btn ds-catalogcta__btn--white" href={primary.href}>
              {primary.label} <span aria-hidden="true">→</span>
            </a>
            {secondary ? (
              <a className="ds-catalogcta__btn ds-catalogcta__btn--outline" href={secondary.href}>
                {secondary.label}
              </a>
            ) : null}
          </div>
          {proof?.quote ? (
            <figure className="ds-catalogcta__proof">
              <blockquote className="ds-catalogcta__proof-quote">“{proof.quote}”</blockquote>
              {proof.by ? (
                <figcaption className="ds-catalogcta__proof-by">{proof.by}</figcaption>
              ) : null}
            </figure>
          ) : proof?.fact ? (
            <div className="ds-catalogcta__proof">
              <span className="ds-catalogcta__proof-fact">{proof.fact}</span>
            </div>
          ) : null}
        </div>

        {demandGroups.length > 0 ? (
          <div className="ds-catalogcta__demand">
            <div className="ds-catalogcta__demand-head">
              <span className="ds-catalogcta__demand-eyebrow">+ {demandEyebrow}</span>
              {demandNote ? (
                <span className="ds-catalogcta__demand-note">{demandNote}</span>
              ) : null}
            </div>
            <div className="ds-catalogcta__demand-body">
              {demandGroups.map((g, gi) => (
                <div className="ds-catalogcta__row" key={gi}>
                  <span className="ds-catalogcta__rowk">{g.label}</span>
                  <div className="ds-catalogcta__chips">
                    {g.items.map((it, ii) => (
                      <span className="ds-catalogcta__chip" key={ii}>
                        {it.label}
                        {it.count != null && it.count !== "" ? (
                          <b className="ds-catalogcta__count">{it.count}</b>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

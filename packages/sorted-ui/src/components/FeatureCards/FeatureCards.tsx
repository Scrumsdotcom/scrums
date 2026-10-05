import "./FeatureCards.css";

export interface SubsystemCard {
  id?: string;
  name: string;
  status?: string;
  readout?: string;
  region?: string;
  linkLabel?: string;
  linkHref?: string;
}

export interface FeatureCardsProps {
  eyebrow?: string;
  summary?: string;
  items?: SubsystemCard[];
}

const DEFAULT_ITEMS: SubsystemCard[] = [
  { id: "SUBSYS-01", name: "TALENT", status: "OPERATIONAL", readout: "400 OPS · 21d RAMP · 94% RETENTION", region: "af-cpt · eu-lon · us-east", linkLabel: "OPEN ▸", linkHref: "#" },
  { id: "SUBSYS-02", name: "DELIVERY", status: "OPERATIONAL", readout: "128 PODS · 12,480 DEPLOYS · 99.999% UPTIME", region: "us-east · us-west · eu-lon", linkLabel: "OPEN ▸", linkHref: "#" },
  { id: "SUBSYS-03", name: "INTELLIGENCE", status: "OPERATIONAL", readout: "41 AGENTS · SDLC-WIDE · 6.2M EVENTS/d", region: "af-nbo · eu-lon · us-west", linkLabel: "OPEN ▸", linkHref: "#" },
];

export function FeatureCards({
  eyebrow = "[SEC-04] SUBSYSTEM REGISTER // SEOP",
  summary = "3 OPERATIONAL",
  items = DEFAULT_ITEMS,
}: FeatureCardsProps) {
  const cards = items.filter((c) => Boolean(c.name));
  return (
    <section className="ds-fcards">
      <div className="ds-fcards__inner">
        {eyebrow || summary ? (
          <div className="ds-fcards__head">
            {eyebrow ? <span className="ds-fcards__eyebrow">{eyebrow}</span> : null}
            {summary ? (
              <span className="ds-fcards__summary">
                <span className="ds-fcards__dot" aria-hidden="true" />
                {summary}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="ds-fcards__grid">
          {cards.map((c, i) => (
            <article className="ds-fcards__card" key={`${c.name}-${i}`}>
              <div className="ds-fcards__top">
                <span className="ds-fcards__id">{c.id || `SUBSYS-${String(i + 1).padStart(2, "0")}`}</span>
                {c.status ? (
                  <span className="ds-fcards__status">
                    <span className="ds-fcards__dot" aria-hidden="true" />
                    {c.status}
                  </span>
                ) : null}
              </div>
              <h3 className="ds-fcards__name">{c.name}</h3>
              {c.readout ? <p className="ds-fcards__readout">{c.readout}</p> : null}
              {c.region ? <span className="ds-fcards__region">{c.region}</span> : null}
              {c.linkLabel ? (
                <a className="ds-fcards__link" href={c.linkHref || "#"}>
                  {c.linkLabel}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

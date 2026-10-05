import "./IntegrationsGrid.css";

export interface Interface {
  name: string;
  status?: string;
  meta?: string;
  logoSrc?: string;
  logoAlt?: string;
  href?: string;
}

export interface IntegrationsGridProps {
  eyebrow?: string;
  summary?: string;
  items?: Interface[];
}

const DEFAULT_ITEMS: Interface[] = [
  { name: "GitHub", status: "LINKED", meta: "SCM · v3 · SYNC 12s" },
  { name: "Linear", status: "LINKED", meta: "PLAN · v2 · SYNC 4s" },
  { name: "Slack", status: "LINKED", meta: "COMMS · v2 · SYNC 1s" },
  { name: "Jira", status: "LINKED", meta: "TRACK · v3 · SYNC 30s" },
  { name: "Vercel", status: "LINKED", meta: "DEPLOY · v6 · SYNC 8s" },
  { name: "Datadog", status: "LINKED", meta: "OBS · v2 · SYNC 2s" },
  { name: "Supabase", status: "LINKED", meta: "DATA · v15 · SYNC 3s" },
  { name: "HubSpot", status: "LINKED", meta: "CRM · v3 · SYNC 60s" },
];

export function IntegrationsGrid({
  eyebrow = "[SEC-07] INTERFACE REGISTRY",
  summary = "8 INTERFACES · 8 LINKED · 0 DEGRADED",
  items = DEFAULT_ITEMS,
}: IntegrationsGridProps) {
  const tiles = items.filter((t) => Boolean(t.name));
  return (
    <section className="ds-integ">
      <div className="ds-integ__inner">
        {eyebrow || summary ? (
          <div className="ds-integ__head">
            {eyebrow ? <span className="ds-integ__eyebrow">{eyebrow}</span> : null}
            {summary ? <span className="ds-integ__summary">{summary}</span> : null}
          </div>
        ) : null}
        <div className="ds-integ__grid">
          {tiles.map((t, i) => {
            const inner = (
              <>
                <div className="ds-integ__row">
                  {t.logoSrc ? (
                    <img className="ds-integ__logo" src={t.logoSrc} alt={t.logoAlt || t.name} loading="lazy" />
                  ) : (
                    <span className="ds-integ__name">{t.name}</span>
                  )}
                  {t.status ? (
                    <span className="ds-integ__status">
                      <span className="ds-integ__dot" aria-hidden="true" />
                      {t.status}
                    </span>
                  ) : null}
                </div>
                {t.logoSrc ? <span className="ds-integ__name">{t.name}</span> : null}
                {t.meta ? <span className="ds-integ__meta">{t.meta}</span> : null}
              </>
            );
            return t.href ? (
              <a className="ds-integ__tile" href={t.href} key={`${t.name}-${i}`}>
                {inner}
              </a>
            ) : (
              <div className="ds-integ__tile" key={`${t.name}-${i}`}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

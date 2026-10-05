import "./PartnerCard.css";

export interface PartnerCardProps {
  name: string;
  href: string;
  logoUrl?: string | null;
  logoAlt?: string | null;
  partnerType?: string | null;
  industry?: string | null;
  description?: string | null;
  featured?: boolean;
}

function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function PartnerCard({
  name,
  href,
  logoUrl,
  logoAlt,
  partnerType,
  industry,
  description,
  featured = false,
}: PartnerCardProps) {
  const labels = [partnerType, industry].filter(Boolean) as string[];
  return (
    <a className="ds-partnercard" href={href}>
      <div className="ds-partnercard__top">
        {logoUrl ? (
          <img className="ds-partnercard__logo" src={logoUrl} alt={logoAlt || `${name} logo`} loading="lazy" />
        ) : (
          <span className="ds-partnercard__monogram" aria-hidden="true">
            {monogram(name)}
          </span>
        )}
        {featured ? <span className="ds-partnercard__badge">featured</span> : null}
      </div>
      <h3 className="ds-partnercard__name">{name}</h3>
      {labels.length > 0 ? (
        <div className="ds-partnercard__labels">
          {labels.map((l, i) => (
            <span className="ds-partnercard__chip" key={`${l}-${i}`}>
              {l}
            </span>
          ))}
        </div>
      ) : null}
      {description ? <p className="ds-partnercard__desc">{description}</p> : null}
      <span className="ds-partnercard__go">
        View partner <span className="ds-partnercard__arrow">→</span>
      </span>
    </a>
  );
}

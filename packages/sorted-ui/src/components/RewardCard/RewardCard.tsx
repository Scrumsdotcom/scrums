import "./RewardCard.css";

export interface RewardCardProps {
  name: string;
  href: string;
  iconUrl?: string | null;
  iconAlt?: string | null;
  category?: string | null;
  deal?: string | null;
  description?: string | null;
}

function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function RewardCard({
  name,
  href,
  iconUrl,
  iconAlt,
  category,
  deal,
  description,
}: RewardCardProps) {
  return (
    <a className="ds-rewardcard" href={href}>
      <div className="ds-rewardcard__top">
        {iconUrl ? (
          <img className="ds-rewardcard__icon" src={iconUrl} alt={iconAlt || `${name} icon`} loading="lazy" />
        ) : (
          <span className="ds-rewardcard__monogram" aria-hidden="true">
            {monogram(name)}
          </span>
        )}
        {category ? <span className="ds-rewardcard__chip">{category}</span> : null}
      </div>
      <div className="ds-rewardcard__head">
        <h3 className="ds-rewardcard__name">{name}</h3>
        {deal ? <span className="ds-rewardcard__deal">{deal}</span> : null}
      </div>
      {description ? <p className="ds-rewardcard__desc">{description}</p> : null}
      <span className="ds-rewardcard__go">
        View item <span className="ds-rewardcard__arrow">→</span>
      </span>
    </a>
  );
}

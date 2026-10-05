import "./EpisodeCard.css";

export interface EpisodeCardProps {
  title: string;
  href: string;
  descriptor?: string | null;
  length?: string | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
}

export function EpisodeCard({ title, href, descriptor, length, coverUrl, coverAlt }: EpisodeCardProps) {
  return (
    <a className="ds-epcard" href={href}>
      <span className="ds-epcard__cover">
        {coverUrl ? (
          <img className="ds-epcard__img" src={coverUrl} alt={coverAlt || `${title} cover`} loading="lazy" />
        ) : null}
        <span className="ds-epcard__badge">Podcast</span>
        {length ? <span className="ds-epcard__dur">{length}</span> : null}
      </span>
      <span className="ds-epcard__body">
        {descriptor ? <span className="ds-epcard__descriptor">{descriptor}</span> : null}
        <h3 className="ds-epcard__title">{title}</h3>
        <span className="ds-epcard__foot">
          {descriptor ? <span className="ds-epcard__meta">Episode</span> : null}
          <span className="ds-epcard__go" aria-hidden="true">listen →</span>
        </span>
      </span>
    </a>
  );
}

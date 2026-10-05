import "./ListenLinks.css";

export interface ListenLinksProps {
  spotify?: string | null;
  apple?: string | null;
  youtube?: string | null;
  label?: string | null;
}

export function ListenLinks({ spotify, apple, youtube, label }: ListenLinksProps) {
  const items = [
    { name: "Spotify", href: spotify },
    { name: "Apple Podcasts", href: apple },
    { name: "YouTube", href: youtube },
  ].filter((i) => i.href);

  if (items.length === 0) return null;

  return (
    <div className="ds-listen">
      {label ? <span className="ds-listen__label">{label}</span> : null}
      <div className="ds-listen__row">
        {items.map((i) => (
          <a key={i.name} className="ds-listen__chip" href={i.href!} target="_blank" rel="noopener nofollow">
            {i.name}
            <span className="ds-listen__arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

import "./DocCard.css";

export interface DocCardProps {
  index: number;
  title: string;
  description: string;
  href: string;
  meta?: string;
  effective?: string;
  highlight?: boolean;
  badge?: string;
}

export function DocCard({
  index,
  title,
  description,
  href,
  meta,
  effective,
  highlight = false,
  badge,
}: DocCardProps) {
  const idx = `/${String(index).padStart(2, "0")}`;
  return (
    <a
      className={`ds-doccard${highlight ? " ds-doccard--hl" : ""}`}
      href={href}
    >
      <div className="ds-doccard__top">
        <span className="ds-doccard__idx">{idx}</span>
        {badge ? <span className="ds-doccard__badge">{badge}</span> : null}
        <span className="ds-doccard__diamond" aria-hidden="true" />
      </div>
      <div className="ds-doccard__title">{title}</div>
      <div className="ds-doccard__desc">{description}</div>
      <div className="ds-doccard__foot">
        {meta ? <span>{meta}</span> : null}
        {meta && effective ? <span className="ds-doccard__dot">·</span> : null}
        {effective ? <span>{effective}</span> : null}
        <span className="ds-doccard__read">
          Read <span className="ds-doccard__arrow">↗</span>
        </span>
      </div>
    </a>
  );
}

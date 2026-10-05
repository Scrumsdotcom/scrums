import "./ResourceCard.css";

export type ResourceType = "article" | "case-study" | "guide" | "video" | "research";

export interface ResourceCardProps {
  type: ResourceType;
  typeLabel?: string;
  title: string;
  href: string;
  excerpt?: string | null;
  date?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  meta?: string | null;
}

const DEFAULT_LABEL: Record<ResourceType, string> = {
  article: "Article",
  "case-study": "Case study",
  guide: "Guide",
  video: "Video",
  research: "Research",
};

export function ResourceCard({
  type,
  typeLabel,
  title,
  href,
  excerpt,
  date,
  imageUrl,
  imageAlt,
  meta,
}: ResourceCardProps) {
  const label = typeLabel || DEFAULT_LABEL[type] || type;
  return (
    <a className={`ds-rescard ds-rescard--${type}`} href={href}>
      {imageUrl ? (
        <span className="ds-rescard__thumb">
          <img src={imageUrl} alt={imageAlt || title} loading="lazy" />
        </span>
      ) : null}
      <span className="ds-rescard__body">
        <span className="ds-rescard__head">
          <span className="ds-rescard__badge">
            <span className="ds-rescard__marker" aria-hidden="true" />
            {label}
          </span>
          {date ? <span className="ds-rescard__date">{date}</span> : null}
        </span>
        <span className="ds-rescard__title">{title}</span>
        {excerpt ? <span className="ds-rescard__excerpt">{excerpt}</span> : null}
      </span>
      <span className="ds-rescard__aside">
        {meta ? <span className="ds-rescard__meta">{meta}</span> : null}
        <span className="ds-rescard__arrow" aria-hidden="true">→</span>
      </span>
    </a>
  );
}

import "./GuideCard.css";

export interface GuideCardProps {
  title: string;
  href: string;
  tag?: string | null;
  readTime?: string | null;
  kind?: string | null;
}

export function GuideCard({ title, href, tag, readTime, kind = "Guide" }: GuideCardProps) {
  return (
    <a className="ds-guidecard" href={href}>
      <span className="ds-guidecard__top">
        {kind ? <span className="ds-guidecard__kind">{kind}</span> : null}
        {tag ? <span className="ds-guidecard__tag">{tag}</span> : null}
      </span>
      <h3 className="ds-guidecard__title">{title}</h3>
      {readTime ? <span className="ds-guidecard__read">{readTime}</span> : null}
    </a>
  );
}

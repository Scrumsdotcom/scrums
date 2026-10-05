import "./CaseStudyCard.css";

export interface CaseStudyCardProps {
  company: string;
  title: string;
  href: string;
  readTime?: string | null;
  solution?: string | null;
  logoUrl?: string | null;
  logoAlt?: string | null;
}

function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function CaseStudyCard({
  company,
  title,
  href,
  readTime,
  solution,
  logoUrl,
  logoAlt,
}: CaseStudyCardProps) {
  return (
    <a className="ds-casecard" href={href}>
      <span className="ds-casecard__top">
        {logoUrl ? (
          <img className="ds-casecard__logo" src={logoUrl} alt={logoAlt || `${company} logo`} loading="lazy" />
        ) : (
          <span className="ds-casecard__monogram" aria-hidden="true">
            {monogram(company)}
          </span>
        )}
        <span className="ds-casecard__company">{company}</span>
      </span>
      <h3 className="ds-casecard__title">{title}</h3>
      {(solution || readTime) ? (
        <span className="ds-casecard__foot">
          {solution ? <span className="ds-casecard__solution">{solution}</span> : null}
          {solution && readTime ? <span className="ds-casecard__dot" aria-hidden="true">·</span> : null}
          {readTime ? <span>{readTime}</span> : null}
        </span>
      ) : null}
    </a>
  );
}

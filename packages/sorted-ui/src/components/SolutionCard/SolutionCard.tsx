import "./SolutionCard.css";

export interface SolutionCardProps {
  title: string;
  description?: string | null;
  href?: string | null;
  index?: string | null;
  cta?: string;
}

export function SolutionCard({ title, description, href, index, cta = "Explore solution" }: SolutionCardProps) {
  const external = !!href && /^https?:\/\//.test(href);
  const body = (
    <>
      <div className="ds-solutioncard__head">
        <span className="ds-solutioncard__mark" aria-hidden="true">
          <span className="ds-solutioncard__chip" />
        </span>
        {index ? <span className="ds-solutioncard__idx">{index}</span> : null}
      </div>
      <h3 className="ds-solutioncard__title">{title}</h3>
      {description ? <p className="ds-solutioncard__desc">{description}</p> : null}
      {href ? (
        <span className="ds-solutioncard__go">
          {cta} <span className="ds-solutioncard__arrow">→</span>
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        className="ds-solutioncard ds-solutioncard--link"
        href={href}
        {...(external ? { target: "_blank", rel: "noopener" } : {})}
      >
        {body}
      </a>
    );
  }
  return <div className="ds-solutioncard">{body}</div>;
}

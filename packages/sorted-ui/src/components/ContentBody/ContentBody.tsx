import "./ContentBody.css";

export interface ContentBodyProps {
  eyebrow?: string;
  title?: string;
  meta?: string;
  html?: string;
}

const DEFAULT_HTML =
  "<h2>Observe, orchestrate, deploy</h2><p>Scrums.com operates talent, delivery, and intelligence as one system instead of fragmented tools and teams. Every engagement reports state on one operated surface.</p><ul><li>Vetted operators embedded in weeks</li><li>Managed pods across five regions</li><li>AI agents across the SDLC</li></ul><p>The enemy is fragmentation; the after is one operated surface.</p>";

export function ContentBody({ eyebrow = "", title = "", meta = "", html = DEFAULT_HTML }: ContentBodyProps) {
  return (
    <article className="ds-content">
      {eyebrow || title || meta ? (
        <header className="ds-content__head">
          {eyebrow ? <span className="ds-content__eyebrow">{eyebrow}</span> : null}
          {title ? <h1 className="ds-content__title">{title}</h1> : null}
          {meta ? <span className="ds-content__meta">{meta}</span> : null}
        </header>
      ) : null}
      <div className="ds-content__body" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}

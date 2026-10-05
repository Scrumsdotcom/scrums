import "./BlogList.css";

export interface Post {
  tag?: string;
  title: string;
  excerpt?: string;
  meta?: string;
  href?: string;
}

export interface BlogListProps {
  eyebrow?: string;
  heading?: string;
  allLabel?: string;
  allHref?: string;
  posts?: Post[];
}

const DEFAULT_POSTS: Post[] = [
  { tag: "DELIVERY", title: "Orchestrating delivery across regions", excerpt: "How work routes to the region that fits latency, cost, and compliance.", meta: "2026.05.20 · 6 min", href: "#" },
  { tag: "TALENT", title: "Operators that ramp in 21 days", excerpt: "The vetting and embedding model behind median 21-day ramp.", meta: "2026.05.12 · 4 min", href: "#" },
  { tag: "INTELLIGENCE", title: "AI agents across the SDLC", excerpt: "Where agents observe, route, and deploy alongside operators.", meta: "2026.04.30 · 8 min", href: "#" },
  { tag: "SYSTEMS", title: "Delivery as telemetry", excerpt: "Reading engagements as readouts instead of status decks.", meta: "2026.04.18 · 5 min", href: "#" },
  { tag: "SCALE", title: "Multi-region orchestration, observed", excerpt: "Scaling across regions without coordination overhead.", meta: "2026.04.05 · 7 min", href: "#" },
  { tag: "PLATFORM", title: "One operated surface", excerpt: "Why fragmentation is the enemy and orchestration is the product.", meta: "2026.03.22 · 6 min", href: "#" },
];

const pad = (i: number) => String(i + 1).padStart(2, "0");

export function BlogList({
  eyebrow = "+ FIELD NOTES",
  heading = "From the platform",
  allLabel = "View all",
  allHref = "#",
  posts = DEFAULT_POSTS,
}: BlogListProps) {
  const items = posts.filter((p) => p.title);

  return (
    <section className="ds-blog">
      <header className="ds-blog__head">
        <div>
          <span className="ds-blog__eyebrow">{eyebrow}</span>
          <h2 className="ds-blog__title">{heading}</h2>
        </div>
        {allLabel ? (
          <a className="ds-blog__all" href={allHref}>
            {allLabel} →
          </a>
        ) : null}
      </header>

      <div className="ds-blog__grid">
        {items.map((p, i) => (
          <a key={`${p.title}-${i}`} className="ds-blog__card" href={p.href ?? "#"}>
            <div className="ds-blog__card-top">
              {p.tag ? <span className="ds-blog__tag">{p.tag}</span> : <span />}
              <span className="ds-blog__idx">/{pad(i)}</span>
            </div>
            <h3 className="ds-blog__card-title">{p.title}</h3>
            {p.excerpt ? <p className="ds-blog__excerpt">{p.excerpt}</p> : null}
            <div className="ds-blog__foot">
              {p.meta ? <span className="ds-blog__meta">{p.meta}</span> : <span />}
              <span className="ds-blog__more">Read ↗</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

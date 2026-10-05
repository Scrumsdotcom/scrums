import { useRef } from "react";
import "./RelatedArticles.css";

export interface Article {
  tag?: string;
  title: string;
  meta?: string;
  href?: string;
}

export interface RelatedArticlesProps {
  eyebrow?: string;
  heading?: string;
  articles?: Article[];
}

const pad = (i: number) => String(i + 1).padStart(2, "0");

const DEFAULT_ARTICLES: Article[] = [
  { tag: "DELIVERY", title: "Orchestrating delivery across regions", meta: "2026.05.20 · 6 min", href: "#" },
  { tag: "TALENT", title: "How embedded operators ramp in 21 days", meta: "2026.05.12 · 4 min", href: "#" },
  { tag: "INTELLIGENCE", title: "AI agents across the SDLC", meta: "2026.04.30 · 8 min", href: "#" },
  { tag: "SCALE", title: "Multi-region orchestration, observed", meta: "2026.04.18 · 5 min", href: "#" },
];

export function RelatedArticles({
  eyebrow = "RELATED",
  heading = "Related deployments",
  articles = DEFAULT_ARTICLES,
}: RelatedArticlesProps) {
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    rail.current?.scrollBy({ left: dir * 320, behavior: reduce ? "auto" : "smooth" });
  };
  const items = articles.filter((a) => a.title);

  return (
    <section className="ds-rel">
      <div className="ds-rel__head">
        <div className="ds-rel__title">
          <span className="ds-rel__eyebrow">+ {eyebrow}</span>
          <h2 className="ds-rel__h">{heading}</h2>
        </div>
        <div className="ds-rel__nav">
          <button type="button" className="ds-rel__arrow" onClick={() => scroll(-1)} aria-label="Previous">
            ←
          </button>
          <button type="button" className="ds-rel__arrow" onClick={() => scroll(1)} aria-label="Next">
            →
          </button>
        </div>
      </div>

      <div className="ds-rel__rail" ref={rail}>
        {items.map((a, i) => (
          <a key={`${a.title}-${i}`} className="ds-rel__card" href={a.href ?? "#"}>
            <div className="ds-rel__card-top">
              {a.tag ? <span className="ds-rel__tag">{a.tag}</span> : <span />}
              <span className="ds-rel__idx">/{pad(i)}</span>
            </div>
            <h3 className="ds-rel__card-title">{a.title}</h3>
            {a.meta ? <span className="ds-rel__meta">{a.meta}</span> : null}
            <span className="ds-rel__more">Read ↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

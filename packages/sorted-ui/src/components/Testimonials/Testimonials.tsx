import { useRef } from "react";
import "./Testimonials.css";

export interface Testimonial {
  quote: string;
  name: string;
  role?: string;
}

export interface TestimonialsProps {
  eyebrow?: string;
  heading?: string;
  items?: Testimonial[];
}

const DEFAULT_ITEMS: Testimonial[] = [
  {
    quote:
      "Scrums.com replaced four vendors and a status meeting with one operated surface. We read delivery as telemetry now.",
    name: "Head of Engineering",
    role: "Series B fintech",
  },
  {
    quote:
      "Operators ramped inside a sprint and shipped to production in week two. The orchestration is the product.",
    name: "VP Product",
    role: "Logistics platform",
  },
  {
    quote:
      "We scaled across three regions without adding coordination overhead. It runs like infrastructure.",
    name: "CTO",
    role: "Healthtech scale-up",
  },
];

const pad = (i: number) => String(i + 1).padStart(2, "0");

export function Testimonials({
  eyebrow = "+ FIELD REPORTS",
  heading = "Operators on the platform",
  items = DEFAULT_ITEMS,
}: TestimonialsProps) {
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    rail.current?.scrollBy({ left: dir * 400, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className="ds-quotes">
      <div className="ds-quotes__head">
        <div>
          <span className="ds-quotes__eyebrow">{eyebrow}</span>
          <h2 className="ds-quotes__title">{heading}</h2>
        </div>
        <div className="ds-quotes__nav">
          <button type="button" className="ds-quotes__arrow" onClick={() => scroll(-1)} aria-label="Previous">
            ←
          </button>
          <button type="button" className="ds-quotes__arrow" onClick={() => scroll(1)} aria-label="Next">
            →
          </button>
        </div>
      </div>

      <div className="ds-quotes__rail" ref={rail}>
        {items.map((t, i) => (
          <figure key={`${t.name}-${i}`} className="ds-quotes__card">
            <span className="ds-quotes__idx">/{pad(i)}</span>
            <blockquote className="ds-quotes__quote">{t.quote}</blockquote>
            <figcaption className="ds-quotes__by">
              <span className="ds-quotes__dot" aria-hidden="true" />
              <span className="ds-quotes__name">{t.name}</span>
              {t.role ? <span className="ds-quotes__role">{t.role}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

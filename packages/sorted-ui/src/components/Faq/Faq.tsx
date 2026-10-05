import "./Faq.css";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqProps {
  index?: string;
  heading?: string;
  tail?: string;
  items?: FaqItem[];
}

const DEFAULT_ITEMS: FaqItem[] = [
  {
    question: "What is SEOP?",
    answer:
      "The Software Engineering Orchestration Platform — talent, delivery, and intelligence operated as one system instead of fragmented tools and teams.",
  },
  {
    question: "How fast do operators ramp?",
    answer:
      "Median 21 days to first deploy. Vetted operators embed into your stack and ship inside the first sprint.",
  },
  {
    question: "Which regions are covered?",
    answer:
      "us-east, us-west, af-cpt, af-nbo, and eu-lon — work routes to the region that fits latency, cost, and compliance.",
  },
  {
    question: "How is delivery measured?",
    answer:
      "Every engagement reports state — uptime, deployments, SLA, and ramp — on one operated surface, not status decks.",
  },
];

const pad = (i: number) => String(i + 1).padStart(2, "0");

export function Faq({
  index = "+ 05",
  heading = "Frequently asked",
  tail = "SEOP // FAQ",
  items = DEFAULT_ITEMS,
}: FaqProps) {
  return (
    <section className="ds-faq">
      <header className="ds-faq__head">
        <span className="ds-faq__index">{index}</span>
        <h2 className="ds-faq__title">{heading}</h2>
        <span className="ds-faq__tail">{tail}</span>
      </header>

      <div className="ds-faq__list">
        {items.map((it, i) => (
          <details key={`${it.question}-${i}`} className="ds-faq__item">
            <summary className="ds-faq__q">
              <span className="ds-faq__idx">/{pad(i)}</span>
              <span className="ds-faq__q-text">{it.question}</span>
              <span className="ds-faq__caret" aria-hidden="true">
                ›
              </span>
            </summary>
            <div className="ds-faq__a">
              <p>{it.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

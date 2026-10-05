import "./ArticleHeader.css";

export interface ArticleMeta {
  label: string;
  value: string;
}

export interface ArticleHeaderProps {
  index?: string;
  category?: string;
  title?: string;
  deck?: string;
  meta?: ArticleMeta[];
}

const DEFAULT_META: ArticleMeta[] = [
  { label: "Ref", value: "DOC-2026-0142" },
  { label: "Author", value: "Sudo" },
  { label: "Published", value: "2026-06-24" },
  { label: "Rev", value: "3 · 1,240w · 6 min" },
];

export function ArticleHeader({
  index = "/01",
  category = "FIELD NOTES",
  title = "Reading delivery as telemetry, not status meetings",
  deck = "How operated engagements report their own state — and why the status meeting is the first thing the platform retires.",
  meta = DEFAULT_META,
}: ArticleHeaderProps) {
  return (
    <header className="ds-arthead">
      <div className="ds-arthead__inner">
        <span className="ds-arthead__eyebrow">
          {index ? <span className="ds-arthead__index">{index}</span> : null}
          <span className="ds-arthead__cat">[POST] // {category}</span>
        </span>
        <h1 className="ds-arthead__title">{title}</h1>
        {deck ? <p className="ds-arthead__deck">{deck}</p> : null}
        {meta.length ? (
          <dl className="ds-arthead__meta">
            {meta.map((m, i) => (
              <div key={`${m.label}-${i}`} className="ds-arthead__cell">
                <dt className="ds-arthead__cell-label">{m.label}</dt>
                <dd className="ds-arthead__cell-value" style={{ margin: 0 }}>
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </header>
  );
}

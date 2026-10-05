import "./TagRow.css";

export interface TagItem {
  label: string;
  href?: string;
}

export interface TagRowProps {
  label?: string;
  tags?: Array<string | TagItem>;
  variant?: "pill" | "link";
}

const DEFAULT_TAGS: TagItem[] = [
  { label: "backend" },
  { label: "python" },
  { label: "af-cpt" },
  { label: "v2.4.0" },
];

function norm(t: string | TagItem): TagItem {
  return typeof t === "string" ? { label: t } : t;
}

export function TagRow({ label, tags = DEFAULT_TAGS, variant = "pill" }: TagRowProps) {
  const items = tags.map(norm).filter((t) => Boolean(t.label));
  if (items.length === 0) return null;
  return (
    <div className={`ds-tagrow ds-tagrow--${variant}`}>
      {label ? <span className="ds-tagrow__label">{label}</span> : null}
      {items.map((t, i) =>
        t.href ? (
          <a className="ds-tagrow__tag" href={t.href} key={`${t.label}-${i}`}>
            {t.label}
          </a>
        ) : (
          <span className="ds-tagrow__tag" key={`${t.label}-${i}`}>
            {t.label}
          </span>
        ),
      )}
    </div>
  );
}

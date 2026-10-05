import "./GlanceBar.css";

export interface GlanceItem {
  label: string;
  value: string;
}

export interface GlanceBarProps {
  items?: GlanceItem[];
  columns?: number;
}

const DEFAULT_ITEMS: GlanceItem[] = [
  { label: "Company", value: "Northwind Data" },
  { label: "Solutions", value: "AI & Automation" },
  { label: "Read time", value: "8 min read" },
  { label: "Published", value: "Jun 9, 2026" },
];

export function GlanceBar({ items = DEFAULT_ITEMS, columns = 4 }: GlanceBarProps) {
  const cells = items.filter((i) => Boolean(i.label) || Boolean(i.value));
  if (cells.length === 0) return null;
  const cols = Math.max(1, Math.min(6, Math.round(columns)));
  return (
    <dl className="ds-glancebar" style={{ ["--ds-gcols" as string]: String(cols) }}>
      {cells.map((g, i) => (
        <div className="ds-glancebar__cell" key={`${g.label}-${i}`}>
          <dt className="ds-glancebar__label">{g.label}</dt>
          <dd className="ds-glancebar__value">{g.value}</dd>
        </div>
      ))}
    </dl>
  );
}

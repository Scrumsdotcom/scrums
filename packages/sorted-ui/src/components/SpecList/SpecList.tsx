import "./SpecList.css";

export interface SpecItem {
  label: string;
  value: string;
}

export interface SpecListProps {
  items?: SpecItem[];
  layout?: "row" | "stack";
}

const DEFAULT_ITEMS: SpecItem[] = [
  { label: "Provider", value: "Scrums.com Platform" },
  { label: "Listing ID", value: "AGT-0142" },
  { label: "Pricing", value: "per engagement" },
  { label: "Version", value: "v2.4.0" },
];

export function SpecList({ items = DEFAULT_ITEMS, layout = "row" }: SpecListProps) {
  const rows = items.filter((i) => Boolean(i.label) || Boolean(i.value));
  return (
    <dl className={`ds-speclist ds-speclist--${layout}`}>
      {rows.map((i, idx) => (
        <div className="ds-speclist__row" key={`${i.label}-${idx}`}>
          <dt className="ds-speclist__label">{i.label}</dt>
          <dd className="ds-speclist__value">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

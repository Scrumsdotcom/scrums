import "./IncludedList.css";

export interface IncludedItem {
  label: string;
  sub?: string;
  tag?: string;
}

export interface IncludedListProps {
  items?: IncludedItem[];
}

const DEFAULT_ITEMS: IncludedItem[] = [
  { label: "Delivery manager", sub: "scope, standups, reporting", tag: "incl." },
  { label: "On-call coverage", sub: "business hours, your timezone", tag: "incl." },
  { label: "Replacement guarantee", sub: "1-click swap, no re-ramp fee", tag: "incl." },
  { label: "Vetting + onboarding", sub: "platform-verified, ready day one", tag: "incl." },
];

export function IncludedList({ items = DEFAULT_ITEMS }: IncludedListProps) {
  const rows = items.filter((i) => Boolean(i.label));
  return (
    <ul className="ds-incl">
      {rows.map((i, idx) => (
        <li className="ds-incl__row" key={`${i.label}-${idx}`}>
          <span className="ds-incl__check" aria-hidden="true">
            ✓
          </span>
          <span className="ds-incl__body">
            <span className="ds-incl__label">{i.label}</span>
            {i.sub ? <span className="ds-incl__sub">{i.sub}</span> : null}
          </span>
          {i.tag ? <span className="ds-incl__tag">{i.tag}</span> : null}
        </li>
      ))}
    </ul>
  );
}

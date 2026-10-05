import "./FacetGroup.css";

export interface Facet {
  label: string;
  count?: number;
  checked?: boolean;
  href?: string;
}

export interface FacetGroupProps {
  title?: string;
  facets?: Facet[];
}

const DEFAULT_FACETS: Facet[] = [
  { label: "Available now", count: 31, checked: true },
  { label: "Ramp ≤ 7 days", count: 22 },
  { label: "Include busy", count: 14 },
];

export function FacetGroup({ title = "AVAILABILITY", facets = DEFAULT_FACETS }: FacetGroupProps) {
  const rows = facets.filter((f) => Boolean(f.label));
  return (
    <fieldset className="ds-facet">
      {title ? <legend className="ds-facet__title">{title}</legend> : null}
      <ul className="ds-facet__list">
        {rows.map((f, i) => (
          <li className="ds-facet__row" key={`${f.label}-${i}`}>
            {f.href ? (
              <a className="ds-facet__link" href={f.href}>
                <span className="ds-facet__box" data-on={f.checked ? "true" : "false"} aria-hidden="true" />
                <span className="ds-facet__label">{f.label}</span>
                {f.count != null ? <span className="ds-facet__count">{f.count}</span> : null}
              </a>
            ) : (
              <label className="ds-facet__label-wrap">
                <input className="ds-facet__input" type="checkbox" defaultChecked={f.checked} />
                <span className="ds-facet__box" aria-hidden="true" />
                <span className="ds-facet__label">{f.label}</span>
                {f.count != null ? <span className="ds-facet__count">{f.count}</span> : null}
              </label>
            )}
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
